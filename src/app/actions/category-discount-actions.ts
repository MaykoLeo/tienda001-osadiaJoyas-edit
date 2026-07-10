"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    createCategoryDiscount,
    updateCategoryDiscount,
    deleteCategoryDiscount,
} from "@/lib/data";

const categoryDiscountSchema = z.object({
    categoryId: z.coerce.number().int().positive("Debes seleccionar una categoría."),
    discountPercentage: z.coerce
        .number()
        .min(1, "El descuento debe ser al menos 1%.")
        .max(100, "El descuento no puede superar el 100%."),
    startDate: z.string().min(1, "La fecha de inicio es obligatoria."),
    endDate: z.string().min(1, "La fecha de fin es obligatoria."),
    bannerTitle: z.string().max(255).optional().nullable(),
    bannerSubtitle: z.string().max(500).optional().nullable(),
    isActive: z.boolean().default(true),
}).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    { message: "La fecha de fin debe ser posterior a la fecha de inicio.", path: ["endDate"] }
);

function revalidateAll() {
    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin");
    revalidatePath("/products", "layout");
}

export async function addCategoryDiscountAction(formData: FormData) {
    const raw = {
        categoryId: formData.get("categoryId"),
        discountPercentage: formData.get("discountPercentage"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        bannerTitle: formData.get("bannerTitle") || null,
        bannerSubtitle: formData.get("bannerSubtitle") || null,
        isActive: formData.get("isActive") === "true",
    };

    const validated = categoryDiscountSchema.safeParse(raw);

    if (!validated.success) {
        return {
            error: validated.error.errors[0]?.message || "Datos inválidos.",
            fieldErrors: validated.error.flatten().fieldErrors,
        };
    }

    try {
        await createCategoryDiscount({
            categoryId: validated.data.categoryId,
            discountPercentage: validated.data.discountPercentage,
            startDate: new Date(validated.data.startDate),
            endDate: new Date(validated.data.endDate),
            bannerTitle: validated.data.bannerTitle ?? null,
            bannerSubtitle: validated.data.bannerSubtitle ?? null,
            isActive: validated.data.isActive,
        });
        revalidateAll();
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "No se pudo crear el descuento de categoría." };
    }
}

export async function updateCategoryDiscountAction(id: number, formData: FormData) {
    const raw = {
        categoryId: formData.get("categoryId"),
        discountPercentage: formData.get("discountPercentage"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        bannerTitle: formData.get("bannerTitle") || null,
        bannerSubtitle: formData.get("bannerSubtitle") || null,
        isActive: formData.get("isActive") === "true",
    };

    const validated = categoryDiscountSchema.safeParse(raw);

    if (!validated.success) {
        return {
            error: validated.error.errors[0]?.message || "Datos inválidos.",
            fieldErrors: validated.error.flatten().fieldErrors,
        };
    }

    try {
        await updateCategoryDiscount(id, {
            categoryId: validated.data.categoryId,
            discountPercentage: validated.data.discountPercentage,
            startDate: new Date(validated.data.startDate),
            endDate: new Date(validated.data.endDate),
            bannerTitle: validated.data.bannerTitle ?? null,
            bannerSubtitle: validated.data.bannerSubtitle ?? null,
            isActive: validated.data.isActive,
        });
        revalidateAll();
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "No se pudo actualizar el descuento de categoría." };
    }
}

export async function deleteCategoryDiscountAction(id: number) {
    try {
        await deleteCategoryDiscount(id);
        revalidateAll();
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "No se pudo eliminar el descuento de categoría." };
    }
}

export async function toggleCategoryDiscountActiveAction(id: number, isActive: boolean) {
    try {
        await updateCategoryDiscount(id, { isActive });
        revalidateAll();
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "No se pudo actualizar el estado del descuento." };
    }
}
