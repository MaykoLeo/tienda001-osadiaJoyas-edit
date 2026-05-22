'use server';

import { Resend } from 'resend';
import { ConfirmationEmail } from '@/emails/ConfirmationEmail';
import { NewOrderNotificationEmail } from '@/emails/NewOrderNotificationEmail';
import { getOrderById } from '@/lib/data';

const resend = new Resend(process.env.RESEND_API_KEY);
const SELLER_EMAIL = 'maykoleo90@gmail.com'; // Reemplaza con tu email si es necesario

export async function sendOrderEmailsAction(orderId: number) {
    try {
        const order = await getOrderById(orderId);
        
        if (!order || !order.items) {
            console.error(`[EMAIL ACTION] CRITICAL FAILURE: Could not find order ${orderId} or order has no items to send emails.`);
            return { error: 'Order not found or invalid' };
        }

        // Enviar email de confirmación al cliente
        try {
            console.log(`[EMAIL ACTION] Sending confirmation email to customer for order ${orderId}.`);
            await resend.emails.send({
                from: 'Osadia Joyas <onboarding@resend.dev>',
                to: [order.customerEmail],
                subject: `Confirmación de tu pedido #${orderId}`,
                react: ConfirmationEmail({
                    customerName: order.customerName || 'Valiosa clienta',
                    orderId: orderId.toString(),
                    totalAmount: order.total,
                    orderItems: order.items,
                }),
            });
            console.log(`[EMAIL ACTION] Confirmation email sent to ${order.customerEmail}.`);
        } catch (emailError: any) {
            console.error(`[EMAIL ACTION] FAILURE: Failed to send confirmation email to customer for order ${orderId}.`, emailError);
        }

        // Enviar email de notificación al vendedor
        try {
            console.log(`[EMAIL ACTION] Sending new order notification to seller for order ${orderId}.`);
            await resend.emails.send({
                from: 'Sistema Osadia <onboarding@resend.dev>',
                to: [SELLER_EMAIL],
                subject: `¡Nuevo Pedido! #${orderId}`,
                react: NewOrderNotificationEmail({
                    orderId: orderId.toString(),
                    customerName: order.customerName || 'N/A',
                    customerEmail: order.customerEmail,
                    totalAmount: order.total,
                    orderItems: order.items,
                }),
            });
            console.log(`[EMAIL ACTION] New order notification sent to ${SELLER_EMAIL}.`);
        } catch (emailError: any) {
            console.error(`[EMAIL ACTION] FAILURE: Failed to send new order notification to seller for order ${orderId}.`, emailError);
        }

        return { success: true };
    } catch (error: any) {
        console.error(`[EMAIL ACTION] GENERAL ERROR processing emails for order ${orderId}:`, error);
        return { error: 'Failed to process emails' };
    }
}
