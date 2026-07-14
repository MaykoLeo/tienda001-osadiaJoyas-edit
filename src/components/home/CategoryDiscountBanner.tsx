import Link from 'next/link';
import { getActiveCategoryDiscounts } from '@/lib/data';
import { Tag, ArrowRight, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export async function CategoryDiscountBanner() {
    const allActive = await getActiveCategoryDiscounts();
    // Máximo 3 banners, ordenados por mayor descuento (ya vienen ordenados por la query)
    const discounts = allActive.slice(0, 3);

    if (discounts.length === 0) return null;

    // Paleta de degradados para los banners (rota entre los 3)
    const gradients = [
        'from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] border-[hsl(var(--primary)/0.3)]',
        'from-[hsl(280,60%,60%,0.15)] to-[hsl(280,60%,60%,0.05)] border-[hsl(280,60%,60%,0.3)]',
        'from-[hsl(30,80%,55%,0.15)] to-[hsl(30,80%,55%,0.05)] border-[hsl(30,80%,55%,0.3)]',
    ];
    const badgeColors = [
        'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
        'bg-[hsl(280,60%,50%)] text-white',
        'bg-[hsl(30,80%,45%)] text-white',
    ];

    return (
        <>
            <section
                id="category-discount-banners"
                aria-label="Ofertas por categoría"
                className="w-full mb-6"
            >
                <div
                    className={`grid gap-4 ${
                        discounts.length === 1
                            ? 'grid-cols-1'
                            : discounts.length === 2
                            ? 'grid-cols-1 sm:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                >
                    {discounts.map((d, i) => (
                        <Link
                            key={d.id}
                            href={`/tienda?category=${d.categoryId}`}
                            className={`
                                group relative overflow-hidden rounded-xl border bg-gradient-to-br ${gradients[i]}
                                p-5 transition-all duration-300
                                hover:shadow-lg hover:scale-[1.02] hover:border-opacity-60
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                            `}
                            aria-label={`Ver ofertas de ${d.categoryName}: ${d.discountPercentage}% de descuento`}
                        >
                            {/* Badge de porcentaje */}
                            <span
                                className={`
                                    inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold
                                    ${badgeColors[i]}
                                    mb-3 shadow-sm
                                `}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                {d.discountPercentage}% OFF
                            </span>

                            {/* Título */}
                            <h3 className="text-lg font-bold font-headline leading-tight text-foreground mb-1">
                                {d.bannerTitle || `Descuento en ${d.categoryName}`}
                            </h3>

                            {/* Subtítulo */}
                            {d.bannerSubtitle && (
                                <p className="text-sm text-muted-foreground leading-snug mb-3">
                                    {d.bannerSubtitle}
                                </p>
                            )}

                            {/* CTA */}
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-auto">
                                <Tag className="h-3.5 w-3.5" />
                                <span>Ver {d.categoryName}</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                            </div>

                            {/* Decorativo: número grande en el fondo */}
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-3 -bottom-4 text-[7rem] font-black leading-none opacity-[0.06] select-none"
                            >
                                {Math.round(d.discountPercentage)}%
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
            <Separator className="w-1/2 mx-auto my-12" />
        </>
    );
}
