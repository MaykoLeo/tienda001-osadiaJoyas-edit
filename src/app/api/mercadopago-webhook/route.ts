
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Resend } from 'resend';
import { ConfirmationEmail } from '@/emails/ConfirmationEmail';
import { NewOrderNotificationEmail } from '@/emails/NewOrderNotificationEmail';
import { getOrderById, updateOrderStatus, deductStockForOrder } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const resend = new Resend(process.env.RESEND_API_KEY);
const SELLER_EMAIL = 'maykoleo90@gmail.com'; // Reemplaza con tu email

export async function POST(request: NextRequest) {
    console.log('[WEBHOOK] ✅ INCOMING NOTIFICATION');
    const body = await request.json();
    console.log('[WEBHOOK] Body received:', body);

    if (body.type === 'payment') {
        const paymentId = body.data.id as string;
        console.log(`[WEBHOOK] Received payment notification for ID: ${paymentId}.`);

        try {
            console.log(`[WEBHOOK] Fetching payment details for ID: ${paymentId}`);
            const payment = await new Payment(client).get({ id: paymentId });
            console.log('[WEBHOOK] Payment details fetched successfully.');

            const orderId = payment.external_reference;
            if (!orderId) {
                console.error('[WEBHOOK] CRITICAL: Payment is missing external_reference.', payment);
                return NextResponse.json({ error: 'External reference not found in payment' }, { status: 400 });
            }
            console.log(`[WEBHOOK] Order ID (external_reference): ${orderId}`);

            const orderIdNumber = Number(orderId);

            if (payment.status === 'approved') {
                console.log(`[WEBHOOK] Payment for order ${orderIdNumber} is approved.`);

                // Obtener la orden para saber en qué estado estaba ANTES del pago
                const orderBeforeUpdate = await getOrderById(orderIdNumber);

                // Determinar nuevo estado según el estado previo de la orden
                const isDepositPayment = orderBeforeUpdate?.status === 'pending_deposit';
                const newStatus: OrderStatus = isDepositPayment ? 'deposit_paid' : 'paid';

                // updateOrderStatus es idémpotente: devuelve false si la orden ya estaba pagada.
                // Esto evita doble procesamiento si MP envía el mismo webhook dos veces (retry).
                const wasUpdated = await updateOrderStatus(orderIdNumber, newStatus, paymentId);

                if (!wasUpdated) {
                    console.log(`[WEBHOOK] ⚠️ Order ${orderIdNumber} already in a paid state. Skipping stock deduction and emails (duplicate webhook).`);
                    return NextResponse.json({ success: true, message: 'Already processed (idempotent)' });
                }

                console.log(`[WEBHOOK] Order status updated to '${newStatus}'.`);

                try {
                    await deductStockForOrder(orderIdNumber);
                    console.log(`[WEBHOOK] Stock deducted for order ${orderIdNumber}.`);
                } catch (stockError: any) {
                    console.error(`[WEBHOOK] CRITICAL FAILURE: Failed to deduct stock for order ${orderIdNumber}. MANUAL INTERVENTION REQUIRED.`, stockError);
                }

                const order = await getOrderById(orderIdNumber);

                if (!order || !order.items) {
                    console.error(`[WEBHOOK] CRITICAL FAILURE: Could not find order ${orderIdNumber} or order has no items to send emails.`);
                } else {
                    // Enviar email de confirmación al cliente
                    try {
                        const subject = isDepositPayment
                            ? `¡Seña recibida! Tu pedido #${orderId} está reservado`
                            : `Confirmación de tu pedido #${orderId}`;
                        console.log(`[WEBHOOK] Sending confirmation email to customer for order ${orderIdNumber}.`);
                        await resend.emails.send({
                            from: 'Osadia Joyas <onboarding@resend.dev>',
                            to: [order.customerEmail],
                            subject,
                            react: ConfirmationEmail({ order }),
                        });
                        console.log(`[WEBHOOK] Confirmation email sent to ${order.customerEmail}.`);
                    } catch (emailError: any) {
                        console.error(`[WEBHOOK] FAILURE: Failed to send confirmation email to customer for order ${orderIdNumber}.`, emailError);
                    }

                    // Enviar email de notificación al vendedor
                    try {
                        const sellerSubject = isDepositPayment
                            ? `¡Seña Recibida! Pedido #${orderId} reservado con seña`
                            : `¡Nuevo Pedido! #${orderId}`;
                        console.log(`[WEBHOOK] Sending new order notification to seller for order ${orderIdNumber}.`);
                        await resend.emails.send({
                            from: 'Sistema Osadia <onboarding@resend.dev>',
                            to: [SELLER_EMAIL],
                            subject: sellerSubject,
                            react: NewOrderNotificationEmail({ order }),
                        });
                        console.log(`[WEBHOOK] New order notification sent to ${SELLER_EMAIL}.`);
                    } catch (emailError: any) {
                        console.error(`[WEBHOOK] FAILURE: Failed to send new order notification to seller for order ${orderIdNumber}.`, emailError);
                    }
                }

                console.log(`[WEBHOOK] ✅ Order ${orderIdNumber} processed successfully as ${newStatus}.`);
                return NextResponse.json({ success: true, orderId: orderIdNumber });

            } else {
                console.log(`[WEBHOOK] Payment for order ${orderIdNumber} is not approved. Status is: ${payment.status}.`);
                
                let newStatus: OrderStatus = (payment.status === 'in_process' || payment.status === 'pending') ? 'pending_payment' : 'failed';

                await updateOrderStatus(orderIdNumber, newStatus, paymentId);
                console.log(`[WEBHOOK] Order ${orderIdNumber} status updated to ${newStatus}.`);
                return NextResponse.json({ success: true, message: `Status updated to ${newStatus}` });
            }

        } catch (error: any) {
            console.error(`[WEBHOOK] 💥 GENERAL ERROR processing payment ${paymentId}:`, error);
            return NextResponse.json({ error: 'Failed to process payment notification' }, { status: 500 });
        }
    }

    console.log("[WEBHOOK] Notification is not of type 'payment'. Ignoring.");
    return NextResponse.json({ success: true, message: 'Notification acknowledged' });
}
