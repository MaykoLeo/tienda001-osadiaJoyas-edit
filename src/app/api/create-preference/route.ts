
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getProductsByIds } from '@/lib/data';
import { CartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 5000 }
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items: clientItems, orderId, discountAmount, couponCode, shippingCost }: { 
            items: CartItem[], 
            orderId: string, 
            discountAmount: number, 
            couponCode?: string, 
            shippingCost: number 
        } = body;

        if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0 || !orderId) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        // --- PASO 1: VERIFICACIÓN DE PRODUCTOS CONTRA LA BASE DE DATOS ---
        const productIds = clientItems.map(item => item.product.id);
        const dbProducts = await getProductsByIds(productIds);
        const dbProductsMap = new Map(dbProducts.map(p => [p.id, p]));

        for (const item of clientItems) {
            const dbProduct = dbProductsMap.get(item.product.id);

            // Verificación 1: El producto existe
            if (!dbProduct) {
                return NextResponse.json({ 
                    error: `Uno de los productos de tu carrito (${item.product.name}) ya no está disponible. Por favor, regresa al carrito para actualizarlo.` 
                }, { status: 400 });
            }

            // Verificación 2: Hay stock suficiente
            if (item.quantity > dbProduct.stock) {
                return NextResponse.json({ 
                    error: `El stock para "${item.product.name}" cambió. Solo quedan ${dbProduct.stock} unidades. Por favor, actualiza tu carrito.`
                }, { status: 400 });
            }

            // Verificación 3: El precio es correcto
            const clientPrice = Number(item.product.salePrice ?? item.product.price);
            const serverPrice = Number(dbProduct.salePrice ?? dbProduct.price);

            if (clientPrice !== serverPrice) {
                return NextResponse.json({ 
                    error: `El precio de "${item.product.name}" cambió a ${formatCurrency(serverPrice)}. Por favor, regresa al carrito para actualizar tu compra.`
                }, { status: 400 });
            }
        }
        // --- FIN DE LA VERIFICACIÓN ---

        const requestUrl = new URL(req.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

        // Usamos los datos del cliente, pero ya han sido validados.
        const preferenceItems = clientItems.map(item => ({
            id: item.product.id.toString(),
            title: item.product.name,
            quantity: item.quantity,
            unit_price: Number(item.product.salePrice ?? item.product.price),
            currency_id: 'ARS',
            description: item.product.description?.substring(0, 100) || ''
        }));
        
        const preferenceData: any = {
            items: preferenceItems,
            payment_methods: { installments: 6 },
            external_reference: String(orderId),
            back_urls: {
                success: `${baseUrl}/checkout/success?orderId=${orderId}`,
                failure: `${baseUrl}/checkout/failure?orderId=${orderId}`,
                pending: `${baseUrl}/checkout/success?orderId=${orderId}&status=pending`,
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/mercadopago-webhook`,
            metadata: {
                orderId: orderId,
                couponCode: couponCode,
            },
        };
        
        if (discountAmount && discountAmount > 0) {
            preferenceData.items.push({
                id: 'DISCOUNT',
                title: couponCode ? `Descuento por cupón (${couponCode})` : 'Descuentos de producto',
                quantity: 1,
                unit_price: -Number(discountAmount),
                currency_id: 'ARS',
            });
        }
        
        if (shippingCost && shippingCost > 0) {
            preferenceData.items.push({
                id: 'SHIPPING',
                title: 'Costo de Envío',
                quantity: 1,
                unit_price: Number(shippingCost),
                currency_id: 'ARS',
            });
        }

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceData });

        return NextResponse.json({ init_point: result.init_point });

    } catch (error: any) {
        console.error('Error creating Mercado Pago preference:', error);
        // Si el error es una instancia de Error, usamos su mensaje
        const errorMessage = error instanceof Error ? error.message : 'Failed to create preference';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
