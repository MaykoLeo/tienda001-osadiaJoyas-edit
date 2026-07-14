import Link from 'next/link';
import Image from 'next/image';
import { getActiveCategoryDiscounts } from '@/lib/data';
import { Tag, ArrowRight, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export async function CategoryDiscountBanner() {
    const allActive = await getActiveCategoryDiscounts();
    // Máximo 3 banners, ordenados por mayor descuento (ya vienen ordenados por la query)
    const discounts = allActive.slice(0, 3);

    if (discounts.length === 0) return null;

    // Paleta de degradados para los banners (rota entre los 3, se usa cuando no hay imagen)
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
                    {discounts.map((d, i) => {
                        const hasImage = !!d.bannerImageUrl;
                        return (
                            <Link
                                key={d.id}
                                href={`/tienda?category=${d.categoryId}`}
                                className={`
                                    group relative overflow-hidden rounded-xl border
                                    ${hasImage
                                        ? 'border-transparent min-h-[160px]'
                                        : `bg-gradient-to-br ${gradients[i]} min-h-[120px]`
                                    }
                                    p-5 transition-all duration-300
                                    hover:shadow-lg hover:scale-[1.02]
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                    flex flex-col
                                `}
                                aria-label={`Ver ofertas de ${d.categoryName}: ${d.discountPercentage}% de descuento`}
                            >
                                {/* Imagen de fondo (si existe) */}
                                {hasImage && (
                                    <>
                                        <Image
                                            src={d.bannerImageUrl!}
                                            alt={`Banner ${d.categoryName}`}
                                            fill
                                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                        {/* Overlay oscuro para legibilidad */}
                                        <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-colors duration-300" />
                                    </>
                                )}

                                {/* Contenido (siempre sobre el fondo) */}
                                <div className="relative z-10 flex flex-col flex-1">
                                    {/* Badge de porcentaje */}
                                    <span
                                        className={`
                                            inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold self-start
                                            ${badgeColors[i]}
                                            mb-3 shadow-sm
                                        `}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {d.discountPercentage}% OFF
                                    </span>

                                    {/* Título */}
                                    <h3 className={`text-lg font-bold font-headline leading-tight mb-1 ${hasImage ? 'text-white' : 'text-foreground'}`}>
                                        {d.bannerTitle || `Descuento en ${d.categoryName}`}
                                    </h3>

                                    {/* Subtítulo */}
                                    {d.bannerSubtitle && (
                                        <p className={`text-sm leading-snug mb-3 ${hasImage ? 'text-white/80' : 'text-muted-foreground'}`}>
                                            {d.bannerSubtitle}
                                        </p>
                                    )}

                                    {/* CTA */}
                                    <div className={`flex items-center gap-1.5 text-sm font-semibold mt-auto ${hasImage ? 'text-white' : 'text-primary'}`}>
                                        <Tag className="h-3.5 w-3.5" />
                                        <span>Ver {d.categoryName}</span>
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                    </div>
                                </div>

                                {/* Decorativo: número grande en el fondo (solo sin imagen) */}
                                {!hasImage && (
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute -right-3 -bottom-4 text-[7rem] font-black leading-none opacity-[0.06] select-none"
                                    >
                                        {Math.round(d.discountPercentage)}%
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </section>
            <Separator className="w-1/2 mx-auto my-12" />
        </>
    );
}
