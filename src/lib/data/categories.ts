
'use server';

import { getDb, isDbConfigured } from '../db';
import type { Category } from '../types';
import { unstable_noStore as noStore } from 'next/cache';

function _mapDbRowToCategory(row: any): Category {
    return {
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
    };
}

export async function getCategories(): Promise<Category[]> {
    if (!isDbConfigured) {
        // En el futuro, podríamos devolver datos de ejemplo si no hay DB
        return []; 
    }
    noStore(); // Asegura que los datos se obtengan en cada petición

    try {
        const db = getDb();
        const rows = await db('SELECT * FROM categories ORDER BY name ASC');
        return rows.map(_mapDbRowToCategory);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch categories.');
    }
}
