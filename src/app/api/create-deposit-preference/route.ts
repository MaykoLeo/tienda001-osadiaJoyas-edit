
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getOrderById } from '@/lib/data';

const DEPOSIT_PERCENTAGE = 0.30; // 30% — definido solo en el servidor

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 5000 }
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId }: { orderId: number } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Falta el ID de la orden.' }, { status: 400 });
        }

        // Buscar la orden en la DB — el monto se toma de acá, NUNCA del cliente
        const order = await getOrderById(Number(orderId));

        if (!order) {
            return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 });
        }

        // Verificaciones de seguridad
        if (order.status !== 'pending_deposit') {
            return NextResponse.json({ error: 'Esta orden no está en estado de espera de seña.' }, { status: 400 });
        }
        if (order.deliveryMethod !== 'pay_in_store') {
            return NextResponse.json({ error: 'La seña solo aplica para pedidos de Pago en Local.' }, { status: 400 });
        }

        // Calcular seña en el servidor — imposible de manipular desde el cliente
        const depositAmount = Math.round(order.total * DEPOSIT_PERCENTAGE * 100) / 100;
        const remainingAmount = Math.round((order.total - depositAmount) * 100) / 100;

        const requestUrl = new URL(req.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

        const preferenceData = {
            items: [
                {
                    id: `DEPOSIT_${orderId}`,
                    title: `Seña 30% - Pedido #${orderId} (Osadía Joyas)`,
                    quantity: 1,
                    unit_price: depositAmount,
                    currency_id: 'ARS',
                    description: `Seña del 30% para reservar tu pedido. Saldo restante (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(remainingAmount)}) se abona en el local.`,
                }
            ],
            payment_methods: { installments: 1 }, // Sin cuotas para la seña
            external_reference: String(orderId),
            back_urls: {
                success: `${baseUrl}/checkout/success?orderId=${orderId}&type=deposit_paid`,
                failure: `${baseUrl}/checkout/failure?orderId=${orderId}`,
                pending: `${baseUrl}/checkout/success?orderId=${orderId}&type=deposit_paid&status=pending`,
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/mercadopago-webhook`,
            metadata: {
                orderId: String(orderId),
                isDeposit: true,
                depositAmount,
                remainingAmount,
            },
        };

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceData });

        return NextResponse.json({ init_point: result.init_point });

    } catch (error: any) {
        console.error('[DEPOSIT PREFERENCE] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create deposit preference';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
