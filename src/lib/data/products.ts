
'use server';

import { getDb, isDbConfigured } from '../db';
import {
    getProducts as getProductsFromHardcodedData,
    getProductById as getProductByIdFromHardcodedData,
    createProduct as createProductFromHardcodedData,
    updateProduct as updateProductFromHardcodedData,
    deleteProduct as deleteProductFromHardcodedData,
} from '../hardcoded-data';
import type { Product } from '../types';
import { unstable_noStore as noStore } from 'next/cache';

function _calculateSalePrice(product: Omit<Product, 'salePrice' | 'id'>): number | null {
    const now = new Date();
    const hasDiscount = product.discountPercentage && product.discountPercentage > 0;

    if (!hasDiscount) {
        return null;
    }

    const hasDateRange = product.offerStartDate && product.offerEndDate;
    const isWithinDateRange = hasDateRange &&
        now >= new Date(product.offerStartDate!) &&
        now <= new Date(product.offerEndDate!);

    if (!hasDateRange || isWithinDateRange) {
        const discount = product.price * (product.discountPercentage! / 100);
        return parseFloat((product.price - discount).toFixed(2));
    }

    return null;
}

function _mapDbRowToProduct(row: any): Product {
    let parsedImages: string[] = [];
    if (row.images) {
        if (typeof row.images === 'string') {
            try {
                parsedImages = JSON.parse(row.images);
            } catch (e) {
                parsedImages = [row.images];
            }
        } else {
            parsedImages = row.images;
        }
    }

    const product: Product = {
        id: row.id,
        name: row.name,
        description: row.description,
        shortDescription: row.short_description,
        price: parseFloat(row.price),
        images: parsedImages,
        categoryIds: row.category_ids || [],
        stock: row.stock,
        sku: row.sku,
        aiHint: row.ai_hint,
        featured: row.featured,
        discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : null,
        offerStartDate: row.offer_start_date,
        offerEndDate: row.offer_end_date,
        salePrice: null,
    };
    product.salePrice = _calculateSalePrice(product);
    return product;
}

interface GetProductsParams {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: 'price' | 'createdAt' | 'name';
    sortDirection?: 'asc' | 'desc';
    featured?: boolean;
    onSale?: boolean;
    _ts?: number; // Timestamp para bypass de caché
}

async function getProductsInternal(
    {
        query,
        category,
        minPrice,
        maxPrice,
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        featured,
        onSale,
    }: GetProductsParams,
    getCount: boolean
): Promise<Product[] | number> {
    if (!isDbConfigured) {
        // Pass the params to the hardcoded function
        const hardcodedProducts = await getProductsFromHardcodedData({
            query, category, minPrice, maxPrice, onSale, featured, sortBy, sortDirection
        });

        // Manual pagination for hardcoded data if needed, or let the function handle it.
        // For simplicity, let's assume the function returns filtered results, and we slice here if not handled there.
        // But better to implement it all inside hardcoded-data.ts
        if (getCount) return hardcodedProducts.length;

        // Apply pagination here if hardcoded function returns all matches
        const start = (page - 1) * limit;
        const end = start + limit;
        return hardcodedProducts.slice(start, end);
    }
    noStore();

    try {
        const db = getDb();
        let conditions: string[] = [];
        let havingConditions: string[] = [];
        let params: any[] = [];
        let paramIndex = 1;

        if (query) {
            const searchTokens = query.toLowerCase().split(' ').filter(t => t.length > 0);
            if (searchTokens.length > 0) {
                const searchCondition = searchTokens.map(token => {
                    params.push(`%${token}%`, `%${token}%`);
                    const condition = `(LOWER(p.name) LIKE $${paramIndex++} OR LOWER(p.short_description) LIKE $${paramIndex++})`;
                    return condition;
                }).join(' AND ');
                conditions.push(`(${searchCondition})`);
            }
        }

        if (featured) {
            conditions.push(`p.featured = true`);
        }

        if (onSale) {
            conditions.push(`(p.discount_percentage IS NOT NULL AND p.discount_percentage > 0 AND (p.offer_start_date IS NULL OR (NOW() BETWEEN p.offer_start_date AND p.offer_end_date)))`);
        }

        if (category && category !== 'All') {
            params.push(Number(category));
            havingConditions.push(`$${paramIndex++} = ANY(array_agg(pc.category_id))`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

        // console.log("Generated Where Clause:", whereClause);
        // console.log("Generated Params:", params);

        if (getCount) {
            const countQuery = `
                SELECT COUNT(*) FROM (
                    SELECT 1
                    FROM products p
                    LEFT JOIN product_categories pc ON p.id = pc.product_id
                    ${whereClause}
                    GROUP BY p.id
                    ${havingClause}
                ) as subquery
            `;
            const countResult = await db(countQuery, params);
            return Number(countResult[0].count);
        }

        const orderByMapping = {
            'createdAt': 'p.created_at',
            'price': 'COALESCE(p.sale_price, p.price)',
            'name': 'p.name'
        };
        const orderBy = orderByMapping[sortBy] || 'p.created_at';
        const orderDirection = sortDirection === 'asc' ? 'ASC' : 'DESC';

        let limitClause = '';
        if (limit > 0) {
            const offset = (page - 1) * limit;
            params.push(limit, offset);
            limitClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        }

        const productsQuery = `
            SELECT 
                p.*, 
                COALESCE(array_agg(pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}') as category_ids
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            ${whereClause}
            GROUP BY p.id
            ${havingClause}
            ORDER BY ${orderBy} ${orderDirection}
            ${limitClause}
        `;

        const rows = await db(productsQuery, params);

        const finalProducts = rows.map(_mapDbRowToProduct);

        return finalProducts.filter((p: Product) => {
            const price = p.salePrice ?? p.price;
            const minPriceMatch = !minPrice || price >= minPrice;
            const maxPriceMatch = !maxPrice || price <= maxPrice;
            return minPriceMatch && maxPriceMatch;
        });

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error(`Failed to fetch ${getCount ? 'count' : 'products'}.`);
    }
}

export async function getFilteredProducts(params: GetProductsParams): Promise<Product[]> {
    return getProductsInternal(params, false) as Promise<Product[]>;
}

export async function getProductsCount(params: GetProductsParams): Promise<number> {
    const { page, limit, ...countParams } = params;
    return getProductsInternal(countParams, true) as Promise<number>;
}

export async function getProducts(): Promise<Product[]> {
    return getFilteredProducts({});
}

export async function getProductById(id: number): Promise<Product | undefined> {
    if (!isDbConfigured) return getProductByIdFromHardcodedData(id);
    noStore();
    try {
        const db = getDb();
        const rows = await db(
            `SELECT p.*, COALESCE(array_agg(pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}') as category_ids
             FROM products p
             LEFT JOIN product_categories pc ON p.id = pc.product_id
             WHERE p.id = $1
             GROUP BY p.id`,
            [id]
        );
        if (rows.length === 0) return undefined;
        return _mapDbRowToProduct(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch product.');
    }
}

export async function createProduct(productData: any): Promise<Product> {
    if (!isDbConfigured) return createProductFromHardcodedData(productData);
    const { categoryIds, ...newProductData } = productData;
    try {
        const db = getDb();

        // Validar que no exista un producto con el mismo nombre
        const existing = await db(
            `SELECT id FROM products WHERE LOWER(name) = LOWER($1)`,
            [newProductData.name]
        );

        if (existing.length > 0) {
            throw new Error(`Ya existe un producto con el nombre "${newProductData.name}".`);
        }

        const productResult = await db(
            `INSERT INTO products (
                name, description, short_description, price, images, stock, "sku",
                ai_hint, featured, discount_percentage, offer_start_date, offer_end_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                newProductData.name, newProductData.description, newProductData.shortDescription,
                newProductData.price, newProductData.images, newProductData.stock, newProductData.sku,
                newProductData.aiHint, newProductData.featured || false, newProductData.discountPercentage,
                newProductData.offerStartDate, newProductData.offerEndDate
            ]
        );
        const createdProductRow = productResult[0];
        if (!createdProductRow || !createdProductRow.id) {
            throw new Error("Falló la creación del producto en la base de datos, no se pudo obtener el ID.");
        }
        if (categoryIds && categoryIds.length > 0) {
            const categoryValues = categoryIds.map((catId: number) => `(${createdProductRow.id}, ${catId})`).join(',');
            await db(`INSERT INTO product_categories (product_id, category_id) VALUES ${categoryValues}`);
        }
        const mappedProduct = _mapDbRowToProduct(createdProductRow);
        mappedProduct.categoryIds = categoryIds || [];
        return mappedProduct;
    } catch (error: any) {
        if (error.message.includes('Ya existe un producto')) {
            throw error; // Re-lanzar el error de validación
        }
        console.error('Database Error (Neon/direct): Failed to create product.', error);
        throw new Error('Failed to create product.');
    }
}

export async function updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'salePrice'>>): Promise<Product> {
    if (!isDbConfigured) return updateProductFromHardcodedData(id, productData);
    const { categoryIds, ...dataToUpdate } = productData;
    try {
        const db = getDb();

        // Si se está actualizando el nombre, validar que no exista otro producto con ese nombre
        if (dataToUpdate.name) {
            const existing = await db(
                `SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND id != $2`,
                [dataToUpdate.name, id]
            );

            if (existing.length > 0) {
                throw new Error(`Ya existe un producto con el nombre "${dataToUpdate.name}".`);
            }
        }

        const columns = Object.keys(dataToUpdate).map((key, i) => {
            const snakeCase = key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase());
            return `"${snakeCase}" = $${i + 2}`;
        }).join(', ');
        const values = Object.values(dataToUpdate);

        if (columns.length > 0) {
            await db(`UPDATE products SET ${columns} WHERE id = $1`, [id, ...values]);
        }

        if (categoryIds !== undefined) {
            console.log('[updateProduct] Updating categories for product', id, '- categoryIds:', categoryIds);
            await db('DELETE FROM product_categories WHERE product_id = $1', [id]);
            if (categoryIds && categoryIds.length > 0) {
                const categoryValues = categoryIds.map((catId: number) => `(${id}, ${catId})`).join(',');
                console.log('[updateProduct] Inserting categories:', categoryValues);
                await db(`INSERT INTO product_categories (product_id, category_id) VALUES ${categoryValues} ON CONFLICT DO NOTHING`);
            } else {
                console.log('[updateProduct] No categories to insert (empty array)');
            }
        }

        const finalProduct = await getProductById(id);
        if (!finalProduct) throw new Error('Product not found after update');
        return finalProduct;
    } catch (error: any) {
        if (error.message.includes('Ya existe un producto')) {
            throw error; // Re-lanzar el error de validación
        }
        console.error('[updateProduct] Database Error:', error);
        throw new Error(`Failed to update product: ${error.message || error}`);
    }
}

export async function deleteProduct(id: number): Promise<void> {
    if (!isDbConfigured) return deleteProductFromHardcodedData(id);
    try {
        const db = getDb();
        await db('DELETE FROM product_categories WHERE product_id = $1', [id]);
        await db('DELETE FROM products WHERE id = $1', [id]);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete product.');
    }
}
