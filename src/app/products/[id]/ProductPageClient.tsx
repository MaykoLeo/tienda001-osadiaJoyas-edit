
"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Home, CreditCard, Truck, Info, X, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/ProductCard';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';

export function ProductPageClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
    const hasStock = product.stock > 0;
    const [api, setApi] = useState<CarouselApi>();
    const [lightboxApi, setLightboxApi] = useState<CarouselApi>();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        if (!api) return;
        api.on("select", () => {
            setCurrentImageIndex(api.selectedScrollSnap());
        });
    }, [api]);

    useEffect(() => {
        if (!lightboxApi) return;
        lightboxApi.on("select", () => {
            setLightboxIndex(lightboxApi.selectedScrollSnap());
        });
    }, [lightboxApi]);

    // Sync lightbox current image when opened
    useEffect(() => {
        if (isLightboxOpen && lightboxApi) {
            lightboxApi.scrollTo(currentImageIndex, true);
            setLightboxIndex(currentImageIndex);
        }
    }, [isLightboxOpen, lightboxApi, currentImageIndex]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (isLightboxOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isLightboxOpen]);

    return (
        <div className="space-y-12 pt-8 max-w-6xl mx-auto px-6 lg:px-8">
            <Breadcrumbs />
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-stretch">
                {/* Columna de Imagen */}
                <div className="w-full flex flex-col h-full">
                    <Carousel setApi={setApi} className="w-full h-full">
                        <CarouselContent className="h-full">
                            {product.images && product.images.length > 0 ? (
                                product.images.map((img, index) => (
                                    <CarouselItem key={index} className="h-full">
                                        <div className='h-full overflow-hidden rounded-[20px] shadow-xl dark:shadow-primary/5 bg-muted/10 ring-1 ring-border/50'>
                                            <div
                                                className="relative w-full h-full min-h-[550px] flex items-center justify-center cursor-zoom-in"
                                                onClick={() => {
                                                    setCurrentImageIndex(index);
                                                    setIsLightboxOpen(true);
                                                }}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${product.name} - image ${index + 1}`}
                                                    fill
                                                    className="object-cover rounded-[20px] transition-transform duration-500 hover:scale-105"
                                                    priority={index === 0}
                                                    data-ai-hint={product.aiHint}
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                />
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))
                            ) : (
                                <CarouselItem className="h-full">
                                    <div className='h-full overflow-hidden rounded-[20px] shadow-xl bg-muted/10 ring-1 ring-border/50'>
                                        <div className="relative w-full h-full min-h-[550px] flex items-center justify-center">
                                            <Image
                                                src="https://placehold.co/800x1000/EFEFEF/333333?text=Sin+Imagen"
                                                alt="Imagen no disponible"
                                                fill
                                                className="object-cover rounded-[20px]"
                                            />
                                        </div>
                                    </div>
                                </CarouselItem>
                            )}
                        </CarouselContent>
                        {product.images && product.images.length > 1 && (
                            <>
                                <CarouselPrevious className='left-4 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-md size-8' />
                                <CarouselNext className='right-4 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-md size-8' />
                            </>
                        )}
                    </Carousel>

                    {/* Pagination Dots */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {product.images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => api?.scrollTo(idx)}
                                    className={`h-2 rounded-full transition-all ${currentImageIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-primary/30'}`}
                                    aria-label={`Ir a imagen ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Columna de Información del Producto */}
                <div className="flex flex-col space-y-4 lg:pl-2">

                    <div className="space-y-1">
                        <h1 className="text-3xl lg:text-[34px] font-bold font-headline leading-tight text-foreground tracking-tight">
                            {product.name}
                        </h1>
                        {product.salePrice && (
                            <div className="pt-1 pb-0.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 dark:bg-destructive/20 dark:text-red-400 dark:border-destructive/30">
                                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline gap-3">
                        {product.salePrice ? (
                            <>
                                <p className="text-3xl lg:text-4xl font-bold text-price-sale tracking-tight">${product.salePrice.toLocaleString('es-AR')}</p>
                                <p className="text-xl text-muted-foreground line-through">${product.price.toLocaleString('es-AR')}</p>
                            </>
                        ) : (
                            <p className="text-3xl lg:text-4xl font-bold text-price tracking-tight">${product.price.toLocaleString('es-AR')}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg max-w-fit">
                        <CreditCard className="h-4 w-4 text-accent" />
                        <p className="text-accent font-medium text-xs">20% de descuento pagando en Efectivo en el local</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasStock ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 text-accent/80" />
                                <span className="font-medium text-accent/80 text-xs text-green-600 dark:text-accent/80">En Stock</span>
                                {product.stock <= 5 && <Badge variant="destructive" className="ml-2 scale-90 text-[10px] h-5 animate-pulse">¡Últimas {product.stock}!</Badge>}
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="font-medium text-destructive text-xs">Sin Stock</span>
                            </>
                        )}
                    </div>

                    {product.shortDescription && (
                        <p className="text-base text-muted-foreground font-sans leading-relaxed">
                            {product.shortDescription}
                        </p>
                    )}

                    {product.description && product.description.trim() && (
                        <p className="text-sm text-muted-foreground/80 font-sans leading-relaxed whitespace-pre-line border-l-2 border-primary/30 pl-4">
                            {product.description}
                        </p>
                    )}

                    <div className="pt-1">
                        {hasStock ? (
                            <AddToCartButton product={product} className="py-5 text-base rounded-lg font-semibold shadow-md shadow-primary/10" />
                        ) : (
                            <div className="w-full py-3.5 bg-muted/50 text-muted-foreground flex items-center justify-center gap-2 rounded-lg font-semibold border border-border/50 cursor-not-allowed">
                                <Ban className="h-4 w-4" />
                                Sin Stock disponible
                            </div>
                        )}
                    </div>

                    <Separator className="opacity-50" />

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6'>
                        <div className="p-5 border border-border/40 bg-card/60 rounded-2xl flex flex-col gap-3 min-h-[140px]">
                            <div className="flex items-center gap-2">
                                <Home className="h-5 w-5 text-primary" />
                                <h4 className="font-bold text-base text-foreground font-headline">Retiro en nuestro local</h4>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground/90 leading-tight">La Rioja 416, Catamarca.</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">Con compra on-line previa. Te confirmaremos por WhatsApp que está listo para retirar.</p>
                            </div>
                        </div>

                        <div className="p-5 border border-border/40 bg-card/60 rounded-2xl flex flex-col gap-1 min-h-[140px]">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-primary" />
                                <h4 className="font-bold text-base text-foreground font-headline">Calcular envío</h4>
                            </div>
                            <div className="mt-auto">
                                <ShippingCalculator />
                            </div>
                        </div>
                    </div>

                </div>
            </div>


            {relatedProducts.length > 0 && (
                <section className="space-y-8 pt-8">
                    <Separator />
                    <div className="text-center">
                        <h2 className="text-3xl font-headline font-bold">Completa tu estilo con...</h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6">
                        {relatedProducts.map((p) => (
                            <div key={p.id} className="w-full sm:w-[calc(50%-1.5rem)] md:w-[calc(33.33%-1.5rem)] lg:w-[calc(25%-1.5rem)] max-w-[280px]">
                                <ProductCard product={p} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Fullscreen Lightbox — rendered via Portal so it always covers the full viewport */}
            {isLightboxOpen && typeof document !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0,0,0,0.96)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                    className="pt-16 pb-4"
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10000 }}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-9 h-9" />
                    </button>

                    {/* Main image carousel */}
                    <div className="relative flex-1 w-full flex items-center justify-center px-4 md:px-16" style={{ minHeight: 0 }}>
                        <Carousel setApi={setLightboxApi} className="w-full h-full">
                            <CarouselContent className="h-full">
                                {product.images?.map((img, i) => (
                                    <CarouselItem key={i} className="h-full flex items-center justify-center">
                                        <div className="relative w-full" style={{ height: '70vh' }}>
                                            <Image src={img} alt="" fill className="object-contain" sizes="95vw" />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {product.images && product.images.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2 bg-white/10 hover:bg-white/20 text-white border-white/20 size-10 md:size-12" />
                                    <CarouselNext className="right-2 bg-white/10 hover:bg-white/20 text-white border-white/20 size-10 md:size-12" />
                                </>
                            )}
                        </Carousel>
                    </div>

                    {/* Thumbnail strip */}
                    {product.images && product.images.length > 1 && (
                        <div className="shrink-0 flex gap-3 px-6 pb-2 pt-4 overflow-x-auto max-w-full">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => lightboxApi?.scrollTo(i)}
                                    className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        lightboxIndex === i
                                            ? 'border-primary opacity-100 scale-105 shadow-xl'
                                            : 'border-white/10 opacity-40 hover:opacity-80'
                                    }`}
                                >
                                    <Image src={img} alt="" fill className="object-cover" sizes="100px" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
