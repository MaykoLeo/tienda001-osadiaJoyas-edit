'use server';

import { getDb } from './db';
import type { Product, Coupon, SalesMetrics, OrderData, OrderStatus, Order, Category, CategoryDiscount, OrderItem, PaymentType } from './types';
import { unstable_noStore as noStore } from 'next/cache';

// --- FUNCIONES DE PRODUCTO ---

// --- Lógica de cálculo de precio: aplica el mayor entre descuento de producto y de categoría ---
function _mapDbRowToProduct(row: any, categoryIds: number[], activeCategoryDiscounts: CategoryDiscount[] = []): Product {
    const price = parseFloat(row.price);
    let salePrice: number | null = null;

    const discountPercentage = row.discount_percentage ? parseFloat(row.discount_percentage) : null;
    const offerStartDate = row.offer_start_date ? new Date(row.offer_start_date) : null;
    const offerEndDate = row.offer_end_date ? new Date(row.offer_end_date) : null;
    const now = new Date();

    // Descuento propio del producto (respeta sus fechas de vigencia)
    let productDiscountPct = 0;
    if (discountPercentage && discountPercentage > 0) {
        const isDateRangeValid = (!offerStartDate || now >= offerStartDate) && (!offerEndDate || now <= offerEndDate);
        if (isDateRangeValid) {
            productDiscountPct = discountPercentage;
        }
    }

    // Mayor descuento de categoría activo que aplique a alguna de las categorías del producto
    const categoryDiscountPct = activeCategoryDiscounts
        .filter(d => categoryIds.includes(d.categoryId))
        .reduce((max, d) => Math.max(max, d.discountPercentage), 0);

    // Aplica el mayor entre ambos
    const effectiveDiscount = Math.max(productDiscountPct, categoryDiscountPct);
    if (effectiveDiscount > 0) {
        salePrice = parseFloat((price - (price * (effectiveDiscount / 100))).toFixed(2));
    }

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: price,
        salePrice: salePrice,
        images: row.images || [],
        stock: row.stock,
        featured: row.is_featured,
        categoryIds: categoryIds,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        discountPercentage: discountPercentage,
        offerStartDate: offerStartDate,
        offerEndDate: offerEndDate,
    };
}

// getProductById también busca las categorías del producto y aplica descuentos de categoría.
export async function getProductById(id: number): Promise<Product | undefined> {
    noStore();
    try {
        const db = getDb();
        const productRows = await db`SELECT * FROM products WHERE id = ${id}`;
        if (productRows.length === 0) return undefined;

        const categoryRows = await db`SELECT category_id FROM product_categories WHERE product_id = ${id}`;
        const categoryIds = categoryRows.map((r: any) => r.category_id);
        const activeCategoryDiscounts = await getActiveCategoryDiscounts();

        return _mapDbRowToProduct(productRows[0], categoryIds, activeCategoryDiscounts);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch product.');
    }
}

// Obtiene múltiples productos por sus IDs aplicando descuentos de categoría.
export async function getProductsByIds(ids: number[]): Promise<Product[]> {
    noStore();
    if (ids.length === 0) {
        return [];
    }
    try {
        const db = getDb();
        const productsRows = await db`SELECT * FROM products WHERE id = ANY(${ids})`;

        if (productsRows.length === 0) return [];

        const productCategoryRows = await db`SELECT product_id, category_id FROM product_categories WHERE product_id = ANY(${ids})`;
        const activeCategoryDiscounts = await getActiveCategoryDiscounts();

        const productsWithCategories = productsRows.map((productRow: any) => {
            const categoryIds = productCategoryRows
                .filter((pc: any) => pc.product_id === productRow.id)
                .map((pc: any) => pc.category_id);
            return _mapDbRowToProduct(productRow, categoryIds, activeCategoryDiscounts);
        });

        return productsWithCategories;
    } catch (error) {
        console.error('Database Error in getProductsByIds:', error);
        throw new Error('Failed to fetch products by IDs.');
    }
}


// --- FUNCIONES DE CATEGORÍA Y CUPONES ---
function _mapDbRowToCategory(row: any): Category { return { id: row.id, name: row.name, parentId: row.parent_id }; }
export async function getCategories(): Promise<Category[]> { noStore(); try { const db = getDb(); const rows = await db`SELECT * FROM categories ORDER BY parent_id, name ASC`; return rows.map(_mapDbRowToCategory); } catch (error) { console.error('Database Error:', error); throw new Error('Failed to fetch categories.'); } }
export async function createCategory(name: string, parentId: number | null = null): Promise<Category> { try { const db = getDb(); const result = await db`INSERT INTO categories (name, parent_id) VALUES (${name}, ${parentId}) RETURNING *;`; return _mapDbRowToCategory(result[0]); } catch (error: any) { if (error.message.includes('duplicate key value')) { throw new Error(`La categoría '${name}' ya existe.`); } console.error('Database Error:', error); throw new Error('Failed to create category.'); } }
export async function deleteCategory(id: number): Promise<{ success: boolean; message?: string }> { try { const db = getDb(); const children = await db`SELECT 1 FROM categories WHERE parent_id = ${id} LIMIT 1`; if (children.length > 0) { return { success: false, message: 'No se puede eliminar. La categoría tiene subcategorías asociadas.' }; } const products = await db`SELECT 1 FROM product_categories WHERE category_id = ${id} LIMIT 1`; if (products.length > 0) { return { success: false, message: 'No se puede eliminar. La categoría está asignada a uno o más productos.' }; } await db`DELETE FROM categories WHERE id = ${id}`; return { success: true }; } catch (error) { console.error('Database Error:', error); throw new Error('Failed to delete category.'); } }
function _mapDbRowToCoupon(row: any): Coupon { return { id: row.id, code: row.code, discountType: row.discount_type, discountValue: parseFloat(row.discount_value), minPurchaseAmount: row.min_purchase_amount ? parseFloat(row.min_purchase_amount) : null, expiryDate: row.expiry_date, isActive: row.is_active, }; }
export async function getCoupons(): Promise<Coupon[]> { noStore(); try { const db = getDb(); const rows = await db`SELECT * FROM coupons ORDER BY created_at DESC`; return rows.map(_mapDbRowToCoupon); } catch (error) { console.error('Database Error:', error); throw new Error('Failed to fetch coupons.'); } }
export async function getCouponByCode(code: string): Promise<Coupon | undefined> { noStore(); try { const db = getDb(); const rows = await db`SELECT * FROM coupons WHERE code = ${code.toUpperCase()} AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date > NOW())`; if (rows.length === 0) return undefined; return _mapDbRowToCoupon(rows[0]); } catch (error) { console.error('Database Error:', error); throw new Error('Failed to fetch coupon.'); } }
export async function createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> { const { code, discountType, discountValue, minPurchaseAmount, expiryDate, isActive } = coupon; try { const db = getDb(); const result = await db`INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, expiry_date, is_active) VALUES (${code.toUpperCase()}, ${discountType}, ${discountValue}, ${minPurchaseAmount}, ${expiryDate?.toISOString()}, ${isActive}) RETURNING *;`; return _mapDbRowToCoupon(result[0]); } catch (error: any) { if (error.message.includes('duplicate key value')) { throw new Error(`El código de cupón '${coupon.code}' ya existe.`); } console.error('Database Error:', error); throw new Error('Failed to create coupon.'); } }
export async function updateCoupon(id: number, couponData: Partial<Omit<Coupon, 'id'>>): Promise<Coupon> { const { code, discountType, discountValue, minPurchaseAmount, expiryDate, isActive } = couponData; try { const db = getDb(); const result = await db`UPDATE coupons SET code = COALESCE(${code?.toUpperCase()}, code), discount_type = COALESCE(${discountType}, discount_type), discount_value = COALESCE(${discountValue}, discount_value), min_purchase_amount = COALESCE(${minPurchaseAmount}, min_purchase_amount), expiry_date = ${expiryDate?.toISOString() || null}, is_active = COALESCE(${isActive}, is_active) WHERE id = ${id} RETURNING *;`; return _mapDbRowToCoupon(result[0]); } catch (error: any) { if (error.message.includes('duplicate key value')) { throw new Error(`El código de cupón '${couponData.code}' ya existe.`); } console.error('Database Error:', error); throw new Error('Failed to update coupon.'); } }
export async function deleteCoupon(id: number): Promise<void> { try { const db = getDb(); await db`DELETE FROM coupons WHERE id = ${id}`; } catch (error) { console.error('Database Error:', error); throw new Error('Failed to delete coupon.'); } }

export async function updateCategory(id: number, name: string): Promise<Category> {
    try {
        const db = getDb();

        // Primero obtener la categoría actual para conocer su parent_id
        const currentCategory = await db`
            SELECT * FROM categories WHERE id = ${id};
        `;

        if (currentCategory.length === 0) {
            throw new Error('Category not found.');
        }

        const parentId = currentCategory[0].parent_id;

        // Validar que no exista otra categoría con el mismo nombre y parent_id
        const existing = parentId === null
            ? await db`
                SELECT id FROM categories 
                WHERE name = ${name} 
                AND parent_id IS NULL 
                AND id != ${id};
              `
            : await db`
                SELECT id FROM categories 
                WHERE name = ${name} 
                AND parent_id = ${parentId} 
                AND id != ${id};
              `;

        if (existing.length > 0) {
            throw new Error(`La categoría '${name}' ya existe.`);
        }

        // Actualizar la categoría
        const result = await db`
            UPDATE categories 
            SET name = ${name} 
            WHERE id = ${id} 
            RETURNING *;
        `;

        return _mapDbRowToCategory(result[0]);
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
            throw new Error(`La categoría '${name}' ya existe.`);
        }
        if (error.message.includes('ya existe')) {
            throw error; // Re-lanzar el error de validación personalizado
        }
        console.error('Database Error:', error);
        throw new Error('Failed to update category.');
    }
}

// --- FUNCIONES CRUD PARA DESCUENTOS DE CATEGORÍA ---

function _mapDbRowToCategoryDiscount(row: any): CategoryDiscount {
    return {
        id: row.id,
        categoryId: row.category_id,
        categoryName: row.category_name ?? undefined,
        discountPercentage: parseFloat(row.discount_percentage),
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        bannerTitle: row.banner_title ?? null,
        bannerSubtitle: row.banner_subtitle ?? null,
        bannerImageUrl: row.banner_image_url ?? null,
        isActive: row.is_active,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
}

/** Todos los descuentos de categoría (para panel admin). */
export async function getCategoryDiscounts(): Promise<CategoryDiscount[]> {
    noStore();
    try {
        const db = getDb();
        const rows = await db`
            SELECT cd.*, c.name AS category_name
            FROM category_discounts cd
            JOIN categories c ON c.id = cd.category_id
            ORDER BY cd.created_at DESC
        `;
        return rows.map(_mapDbRowToCategoryDiscount);
    } catch (error) {
        console.error('Database Error getCategoryDiscounts:', error);
        throw new Error('Failed to fetch category discounts.');
    }
}

/** Solo los descuentos activos vigentes (para cálculo de precios y banners del home). */
export async function getActiveCategoryDiscounts(): Promise<CategoryDiscount[]> {
    noStore();
    try {
        const db = getDb();
        const now = new Date().toISOString();
        const rows = await db`
            SELECT cd.*, c.name AS category_name
            FROM category_discounts cd
            JOIN categories c ON c.id = cd.category_id
            WHERE cd.is_active = TRUE
              AND cd.start_date <= ${now}
              AND cd.end_date   >= ${now}
            ORDER BY cd.discount_percentage DESC
        `;
        return rows.map(_mapDbRowToCategoryDiscount);
    } catch (error) {
        console.error('Database Error getActiveCategoryDiscounts:', error);
        // Silencioso: si falla esta query, los precios se mantienen sin descuento de categoría
        return [];
    }
}

export async function createCategoryDiscount(data: Omit<CategoryDiscount, 'id' | 'categoryName' | 'createdAt'>): Promise<CategoryDiscount> {
    try {
        const db = getDb();
        const result = await db`
            INSERT INTO category_discounts
              (category_id, discount_percentage, start_date, end_date, banner_title, banner_subtitle, banner_image_url, is_active)
            VALUES
              (${data.categoryId}, ${data.discountPercentage}, ${data.startDate.toISOString()}, ${data.endDate.toISOString()}, ${data.bannerTitle}, ${data.bannerSubtitle}, ${data.bannerImageUrl ?? null}, ${data.isActive})
            RETURNING *
        `;
        // Incluir nombre de categoría para la respuesta
        const catRows = await db`SELECT name FROM categories WHERE id = ${data.categoryId}`;
        return _mapDbRowToCategoryDiscount({ ...result[0], category_name: catRows[0]?.name });
    } catch (error) {
        console.error('Database Error createCategoryDiscount:', error);
        throw new Error('Failed to create category discount.');
    }
}

export async function updateCategoryDiscount(id: number, data: Partial<Omit<CategoryDiscount, 'id' | 'categoryName' | 'createdAt'>>): Promise<CategoryDiscount> {
    try {
        const db = getDb();
        const result = await db`
            UPDATE category_discounts SET
              category_id         = COALESCE(${data.categoryId ?? null}, category_id),
              discount_percentage = COALESCE(${data.discountPercentage ?? null}, discount_percentage),
              start_date          = COALESCE(${data.startDate?.toISOString() ?? null}, start_date),
              end_date            = COALESCE(${data.endDate?.toISOString() ?? null}, end_date),
              banner_title        = COALESCE(${data.bannerTitle ?? null}, banner_title),
              banner_subtitle     = COALESCE(${data.bannerSubtitle ?? null}, banner_subtitle),
              banner_image_url    = ${data.bannerImageUrl !== undefined ? (data.bannerImageUrl ?? null) : db`banner_image_url`},
              is_active           = COALESCE(${data.isActive ?? null}, is_active)
            WHERE id = ${id}
            RETURNING *
        `;
        if (result.length === 0) throw new Error('Category discount not found.');
        const catRows = await db`SELECT name FROM categories WHERE id = ${result[0].category_id}`;
        return _mapDbRowToCategoryDiscount({ ...result[0], category_name: catRows[0]?.name });
    } catch (error) {
        console.error('Database Error updateCategoryDiscount:', error);
        throw new Error('Failed to update category discount.');
    }
}

export async function deleteCategoryDiscount(id: number): Promise<void> {
    try {
        const db = getDb();
        await db`DELETE FROM category_discounts WHERE id = ${id}`;
    } catch (error) {
        console.error('Database Error deleteCategoryDiscount:', error);
        throw new Error('Failed to delete category discount.');
    }
}

// --- LÓGICA DE ÓRDENES ---

export async function createOrder(orderData: OrderData): Promise<{ orderId?: number, error?: string }> {
    try {
        const db = getDb();
        for (const item of orderData.items) {
            const productResult = await db`SELECT stock, name FROM products WHERE id = ${item.productId}`;
            if (productResult.length === 0) return { error: `Producto con ID ${item.productId} no encontrado.` };
            if (productResult[0].stock < item.quantity) {
                return { error: `Stock insuficiente para \"${productResult[0].name}\".` };
            }
        }

        const { customerFirstName, customerLastName, customerEmail, customerPhone, total, status, items, couponCode, discountAmount, deliveryMethod, paymentType, pickupName, pickupDni, shippingStreet, shippingNumber, shippingFloor, shippingApartment, shippingPostalCode, shippingLocality, shippingProvince, notes, depositAmount, remainingAmount } = orderData;
        const customerName = `${customerFirstName} ${customerLastName}`.trim();
        // Construir direccion completa para guardar en shipping_address
        const shippingAddressFull = [shippingStreet, shippingNumber, shippingFloor ? `Piso ${shippingFloor}` : null, shippingApartment ? `Dpto ${shippingApartment}` : null].filter(Boolean).join(', ');

        const orderResult = await db`
            INSERT INTO orders (customer_name, customer_email, customer_phone, total, status, items, coupon_code, discount_amount, delivery_method, payment_type, pickup_name, pickup_dni, shipping_address, shipping_city, shipping_postal_code, notes, deposit_amount, remaining_amount, created_at)
            VALUES (${customerName}, ${customerEmail}, ${customerPhone}, ${total}, ${status}, ${JSON.stringify(items)}::jsonb, ${couponCode}, ${discountAmount}, ${deliveryMethod}, ${paymentType}, ${pickupName}, ${pickupDni}, ${shippingAddressFull || null}, ${shippingLocality || null}, ${shippingPostalCode || null}, ${notes || null}, ${depositAmount ?? null}, ${remainingAmount ?? null}, ${new Date().toISOString()})
            RETURNING id;
        `;
        return { orderId: orderResult[0].id };
    } catch (error: any) {
        console.error('Database Error:', error);
        return { error: error.message || 'Failed to create order.' };
    }
}

export async function deductStockForOrder(orderId: number): Promise<void> {
    try {
        const db = getDb();
        const orderRows = await db`SELECT items FROM orders WHERE id = ${orderId}`;
        if (orderRows.length > 0) {
            const items = orderRows[0].items as OrderItem[];
            for (const item of items) {
                await db`UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.productId} AND stock >= ${item.quantity}`;
            }
            console.log(`Stock deducted for order ${orderId}`);
        }
    } catch (error) {
        console.error(`CRITICAL: Failed to deduct stock for order ${orderId}.`, error);
        throw new Error('Failed to deduct stock.');
    }
}

export async function updateOrderStatus(orderId: number, status: OrderStatus, paymentId?: string | null): Promise<void> {
    try {
        const db = getDb();
        if (paymentId !== undefined) {
            await db`UPDATE orders SET status = ${status}, payment_id = COALESCE(${paymentId}, payment_id) WHERE id = ${orderId}`;
        } else {
            await db`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
        }
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update order status.');
    }
}

function mapOrderFromDb(row: any): Order {
    const fullName: string = row.customer_name || '';
    const nameParts = fullName.split(' ');
    const customerLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const customerFirstName = nameParts[0] || fullName;
    return {
        id: row.id, customerFirstName, customerLastName, customerEmail: row.customer_email,
        customerPhone: row.customer_phone, total: parseFloat(row.total), status: row.status as OrderStatus,
        createdAt: new Date(row.created_at), items: row.items, couponCode: row.coupon_code,
        discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
        paymentId: row.payment_id || undefined, deliveryMethod: row.delivery_method, paymentType: row.payment_type, pickupName: row.pickup_name,
        pickupDni: row.pickup_dni,
        // Los campos de dirección se guardan en las columnas legacy de DB
        shippingAddress: row.shipping_address,
        shippingLocality: row.shipping_city,
        shippingPostalCode: row.shipping_postal_code,
        shippingProvince: row.shipping_province || undefined,
        notes: row.notes,
        depositAmount: row.deposit_amount ? parseFloat(row.deposit_amount) : undefined,
        remainingAmount: row.remaining_amount ? parseFloat(row.remaining_amount) : undefined,
    };
}

export async function getOrderById(id: number): Promise<Order | undefined> { noStore(); try { const db = getDb(); const result = await db`SELECT * FROM orders WHERE id = ${id}`; if (result.length === 0) return undefined; return mapOrderFromDb(result[0]); } catch (error) { console.error('Database Error:', error); throw new Error('Failed to fetch order.'); } }
export async function getOrderByPaymentId(paymentId: string): Promise<Order | undefined> { noStore(); try { const db = getDb(); const result = await db`SELECT * FROM orders WHERE payment_id = ${paymentId}`; if (result.length === 0) return undefined; return mapOrderFromDb(result[0]); } catch (error) { console.error('Database Error:', error); throw new Error('Failed to fetch order by payment ID.'); } }

export async function createOrderFromWebhook(paymentData: any): Promise<{ newOrder?: Order, error?: string }> {
    const { payer, additional_info, transaction_amount, external_reference, id: paymentId } = paymentData;
    if (!external_reference || !additional_info?.items || additional_info.items.length === 0) {
        return { error: 'Webhook data is missing fields to create an order.' };
    }

    const items: OrderItem[] = additional_info.items.map((item: any) => ({
        productId: parseInt(item.id),
        name: item.title,
        image: item.picture_url || '',
        quantity: parseInt(item.quantity),
        priceAtPurchase: parseFloat(item.unit_price),
        originalPrice: null,
    }));

    const orderData = {
        customerName: payer.first_name ? `${payer.first_name} ${payer.last_name || ''}`.trim() : 'N/A',
        customerEmail: payer.email, total: transaction_amount, status: 'paid' as OrderStatus,
        items: items, paymentId: String(paymentId), deliveryMethod: 'shipping' as const, paymentType: 'QR / Tarjeta' as PaymentType,
        shippingAddress: 'N/A', shippingCity: 'N/A', shippingPostalCode: 'N/A',
    };

    try {
        const db = getDb();
        const orderResult = await db`
            INSERT INTO orders (id, customer_name, customer_email, total, status, items, payment_id, delivery_method, payment_type, shipping_address, shipping_city, shipping_postal_code, created_at)
            VALUES (${external_reference}, ${orderData.customerName}, ${orderData.customerEmail}, ${orderData.total}, ${orderData.status}, ${JSON.stringify(orderData.items)}::jsonb, ${orderData.paymentId}, ${orderData.deliveryMethod}, ${orderData.paymentType}, ${orderData.shippingAddress}, ${orderData.shippingCity}, ${orderData.shippingPostalCode}, ${new Date().toISOString()})
            ON CONFLICT (id) DO NOTHING RETURNING *;
        `;
        if (orderResult.length === 0) {
            const existingOrder = await getOrderById(parseInt(String(external_reference), 10));
            return { newOrder: existingOrder };
        }
        return { newOrder: mapOrderFromDb(orderResult[0]) };
    } catch (error: any) {
        console.error('Database Error creating from webhook:', error);
        return { error: error.message || 'Failed to create order from webhook.' };
    }
}

export async function getSalesMetrics(startDate?: Date, endDate?: Date): Promise<SalesMetrics> {
    noStore();
    try {
        const db = getDb();
        let revenueResult;
        let productsResult;
        let gemasResult;
        let revenueByDateResult;

        if (startDate && endDate) {
            revenueResult = await db`
                SELECT 
                    SUM(total) as totalRevenue, 
                    COUNT(*) as totalSales,
                    (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'pending_payment', 'awaiting_payment_in_store') AND created_at >= ${startDate.toISOString()} AND created_at <= ${endDate.toISOString()}) as pendingOrders
                FROM orders
                WHERE status IN ('paid', 'delivered', 'shipped')
                AND created_at >= ${startDate.toISOString()}
                AND created_at <= ${endDate.toISOString()}
            `;
            productsResult = await db`
                SELECT (item->>'productId')::int as "productId", item->>'name' as name, SUM((item->>'quantity')::int) as count, SUM((item->>'quantity')::int * (item->>'priceAtPurchase')::numeric) as revenue
                FROM orders, jsonb_array_elements(items) as item
                WHERE status IN ('paid', 'delivered', 'shipped')
                AND created_at >= ${startDate.toISOString()}
                AND created_at <= ${endDate.toISOString()}
                GROUP BY 1, 2 ORDER BY count DESC;
            `;
            gemasResult = productsResult; // Use the same consolidated result
            revenueByDateResult = await db`
                SELECT
                    DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') as date,
                    SUM(CASE WHEN status IN ('paid', 'delivered', 'shipped') THEN total ELSE 0 END) as revenue,
                    SUM(total) as estimated_revenue,
                    COUNT(CASE WHEN status IN ('paid', 'delivered', 'shipped') THEN 1 END) as orders,
                    COUNT(*) as all_orders
                FROM orders
                WHERE created_at >= ${startDate.toISOString()}
                AND created_at <= ${endDate.toISOString()}
                GROUP BY 1
                ORDER BY 1 ASC;
            `;
        } else {
            revenueResult = await db`
                SELECT 
                    SUM(total) as totalRevenue, 
                    COUNT(*) as totalSales,
                    (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'pending_payment', 'awaiting_payment_in_store')) as pendingOrders
                FROM orders
                WHERE status IN ('paid', 'delivered', 'shipped')
            `;
            productsResult = await db`
                SELECT (item->>'productId')::int as "productId", item->>'name' as name, SUM((item->>'quantity')::int) as count, SUM((item->>'quantity')::int * (item->>'priceAtPurchase')::numeric) as revenue
                FROM orders, jsonb_array_elements(items) as item
                WHERE status IN ('paid', 'delivered', 'shipped')
                GROUP BY 1, 2 ORDER BY count DESC;
            `;
            gemasResult = productsResult; // Use the same consolidated result
            revenueByDateResult = await db`
                SELECT
                    DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') as date,
                    SUM(CASE WHEN status IN ('paid', 'delivered', 'shipped') THEN total ELSE 0 END) as revenue,
                    SUM(total) as estimated_revenue,
                    COUNT(CASE WHEN status IN ('paid', 'delivered', 'shipped') THEN 1 END) as orders,
                    COUNT(*) as all_orders
                FROM orders
                GROUP BY 1
                ORDER BY 1 ASC;
            `;
        }

        const { totalrevenue, totalsales, pendingorders } = revenueResult[0];
        return {
            totalRevenue: parseFloat(totalrevenue) || 0,
            totalSales: parseInt(totalsales) || 0,
            pendingOrders: parseInt(pendingorders) || 0,
            topSellingProducts: productsResult.map((r: any) => ({ productId: r.productId, name: r.name, count: Number(r.count) })),
            topRevenueProducts: productsResult.map((r: any) => ({ productId: r.productId, name: r.name, revenue: parseFloat(r.revenue) || 0 })),
            revenueByDate: revenueByDateResult.map((r: any) => ({
                date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
                revenue: parseFloat(r.revenue) || 0,
                estimatedRevenue: parseFloat(r.estimated_revenue) || 0,
                orders: parseInt(r.orders) || 0,
                allOrders: parseInt(r.all_orders) || 0,
            })),
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch sales metrics.');
    }
}


export async function getOrders(): Promise<Order[]> {
    noStore();
    try {
        const db = getDb();
        const rows = await db`SELECT * FROM orders ORDER BY created_at DESC`;
        return rows.map(mapOrderFromDb);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch orders.');
    }
}

export async function getEarliestOrderDate(): Promise<Date | null> {
    noStore();
    try {
        const db = getDb();
        const result = await db`SELECT MIN(created_at) as earliest_date FROM orders WHERE status IN ('paid', 'delivered', 'shipped')`;
        if (result.length > 0 && result[0].earliest_date) {
            return new Date(result[0].earliest_date);
        }
        return null;
    } catch (error) {
        console.error('Database Error:', error);
        return null;
    }
}

export async function fetchProductMetrics(productId: number, startDate?: Date, endDate?: Date) {
    noStore();
    try {
        const db = getDb();
        let queryResult;

        if (startDate && endDate) {
            queryResult = await db`
                SELECT
                    DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') as date,
                    SUM((item->>'quantity')::int) as units_sold,
                    SUM((item->>'quantity')::int * (item->>'priceAtPurchase')::numeric) as revenue
                FROM orders, jsonb_array_elements(items) as item
                WHERE status IN ('paid', 'delivered', 'shipped')
                AND (item->>'productId')::int = ${productId}
                AND created_at >= ${startDate.toISOString()}
                AND created_at <= ${endDate.toISOString()}
                GROUP BY 1
                ORDER BY 1 ASC;
            `;
        } else {
             queryResult = await db`
                SELECT
                    DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') as date,
                    SUM((item->>'quantity')::int) as units_sold,
                    SUM((item->>'quantity')::int * (item->>'priceAtPurchase')::numeric) as revenue
                FROM orders, jsonb_array_elements(items) as item
                WHERE status IN ('paid', 'delivered', 'shipped')
                AND (item->>'productId')::int = ${productId}
                GROUP BY 1
                ORDER BY 1 ASC;
            `;
        }

        return queryResult.map((r: any) => ({
            date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
            unitsSold: parseInt(r.units_sold) || 0,
            revenue: parseFloat(r.revenue) || 0
        }));

    } catch (error) {
        console.error('Database Error in fetchProductMetrics:', error);
        throw new Error('Failed to fetch individual product metrics.');
    }
}
