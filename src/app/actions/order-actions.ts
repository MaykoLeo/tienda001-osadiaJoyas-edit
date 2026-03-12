'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrderById, updateOrderStatus, deductStockForOrder, createOrder } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

const orderStatusSchema = z.enum([
    'pending_payment',
    'awaiting_payment_in_store',
    'paid',
    'failed',
    'cancelled',
    'shipped',
    'delivered',
    'refunded'
]);

export async function updateOrderStatusAction(orderId: number, newStatus: OrderStatus) {
    const validatedStatus = orderStatusSchema.safeParse(newStatus);
    if (!validatedStatus.success) {
        return { error: 'Estado de orden inválido.' };
    }

    try {
        const currentOrder = await getOrderById(orderId);
        if (!currentOrder) {
            return { error: 'Orden no encontrada.' };
        }

        const currentStatus = currentOrder.status;
        const deliveryMethod = currentOrder.deliveryMethod;

        // --- NUEVAS REGLAS DE VALIDACIÓN ---

        // Regla 1: Prevenir que una orden de pago web (shipping) sea marcada como pago en local.
        if (deliveryMethod === 'shipping' && newStatus === 'awaiting_payment_in_store') {
            return { error: 'Una orden con envío no puede ser cambiada a "Esperando Pago en Local".' };
        }

        // Regla 2: Prevenir que una orden de pago local (pickup) sea marcada manually como pagada.
        if (deliveryMethod === 'pickup' && newStatus === 'paid') {
            return { error: 'Una orden de retiro en local debe ser marcada como "Entregado", no como "Pagado".' };
        }

        // --- LÓGICA DE DESCUENTO DE STOCK ACTUALIZADA ---

        // Ahora, el descuento de stock solo ocurre si TODAS las condiciones se cumplen:
        // 1. El estado anterior es 'awaiting_payment_in_store'.
        // 2. El nuevo estado es 'delivered'.
        // 3. El método de la orden es 'pickup' o 'pay_in_store'.
        if (currentStatus === 'awaiting_payment_in_store' && newStatus === 'delivered' && (deliveryMethod === 'pickup' || deliveryMethod === 'pay_in_store')) {
            console.log(`Order ${orderId} (local pickup or pay in store) is being delivered. Deducting stock.`);
            await deductStockForOrder(orderId);
        }

        // Actualizar el estado de la orden
        await updateOrderStatus(orderId, newStatus);

        revalidatePath('/admin');
        revalidatePath(`/admin/orders/${orderId}`);

        return { message: 'El estado de la orden fue actualizado exitosamente.' };

    } catch (e: any) {
        console.error('Action Error:', e);
        return { error: e.message || 'No se pudo actualizar el estado de la orden.' };
    }
}

const manualOrderSchema = z.object({
    items: z.string(), // JSON string of OrderItem[]
    customerName: z.string().max(100).optional(),
    customerEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
        message: "Email inválido"
    }),
    customerPhone: z.string().max(20).optional(),
    discountAmount: z.string().optional(), // Descuento manual aplicado
    paymentMethod: z.enum(['Efectivo', 'Transferencia', 'QR / Tarjeta']).optional(),
    notes: z.string().max(100).optional(),
});

export async function createManualOrderAction(formData: FormData) {
    const rawData = {
        items: formData.get('items'),
        customerName: formData.get('customerName') || undefined,
        customerEmail: formData.get('customerEmail') || undefined,
        customerPhone: formData.get('customerPhone') || undefined,
        discountAmount: formData.get('discountAmount') || undefined,
        paymentMethod: formData.get('paymentMethod') || undefined,
        notes: formData.get('notes') || undefined,
    };

    const validatedFields = manualOrderSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: 'Datos de orden inválidos.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    const { items: itemsJson, customerName, customerEmail, customerPhone, discountAmount: discountAmountStr, paymentMethod, notes } = validatedFields.data;

    let items;
    try {
        items = JSON.parse(itemsJson);
        if (!Array.isArray(items) || items.length === 0) throw new Error('Carrito vacío');
    } catch (e) {
        return { error: 'Error al procesar los productos de la orden.' };
    }

    // Parsear descuento manual
    const discountAmount = discountAmountStr ? parseFloat(discountAmountStr) : 0;

    // Calcular subtotal y total con descuento
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.priceAtPurchase * item.quantity), 0);
    const total = subtotal - discountAmount;

    const orderData: any = {
        items,
        total,
        customerName: customerName || 'Cliente en Local',
        customerEmail: customerEmail || 'noreply@local.store',
        customerPhone: customerPhone || '',
        status: 'delivered', // Entregado inmediatamente
        deliveryMethod: 'pickup', // O 'pay_in_store', pero 'pickup' encaja bien
        paymentType: paymentMethod || 'Efectivo',
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        shippingAddress: '',
        shippingCity: '',
        shippingPostalCode: '',
        pickupName: customerName || 'Cliente Presencial',
        pickupDni: '',
        notes: notes || '',
    };

    try {
        const result = await createOrder(orderData);
        if (result.error || !result.orderId) {
            return { error: result.error || 'Error al crear la orden.' };
        }

        // Descontar stock inmediatamente
        await deductStockForOrder(result.orderId);

        revalidatePath('/admin');
        return { message: 'Orden manual creada exitosamente.' };
    } catch (error: any) {
        return { error: error.message || 'Error inesperado al crear la orden.' };
    }
}
