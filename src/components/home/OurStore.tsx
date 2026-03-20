"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';

export function OurStore() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxApi, setLightboxApi] = useState<CarouselApi>();
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const allImages = [
        { src: "/local/foto1.JPG", alt: "Interior del local - Vista 1" },
        { src: "/local/foto2.JPG", alt: "Interior del local - Vista 2" },
        { src: "/local/foto3.JPG", alt: "Interior del local - Vista 3" },
    ];

    // Sync lightbox state when open
    useEffect(() => {
        if (!lightboxApi) return;

        const onSelect = () => {
            setLightboxIndex(lightboxApi.selectedScrollSnap());
        };

        lightboxApi.on('select', onSelect);
        setLightboxIndex(lightboxApi.selectedScrollSnap());

        return () => {
            lightboxApi.off('select', onSelect);
        };
    }, [lightboxApi]);

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
        <section id="our-store" className="py-12 overflow-hidden">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:items-stretch">

                {/* Bloque de Texto (Título + Descripción) */}
                <div className="space-y-10 order-1">
                    <div className="space-y-3">
                        <span className="text-primary uppercase tracking-[0.4em] text-[12px] font-headline font-bold block">
                            Visítanos
                        </span>
                        <h2 className="text-5xl font-headline font-bold leading-[1.1]">
                            Nuestro Local
                        </h2>
                    </div>

                    <div className="space-y-5 text-muted-foreground/90 text-lg leading-relaxed">
                        <p>
                            Ubicado en el corazón de la ciudad, nuestro local es más que una tienda; es un espacio diseñado para sumergirse en la esencia de Osadía. Cada detalle ha sido pensado para reflejar nuestra filosofía de elegancia minimalista y atención al detalle.
                        </p>
                        <p>
                            Te invitamos a visitarnos para conocer nuestras colecciones en persona, recibir asesoramiento personalizado y descubrir la pieza perfecta que exprese tu identidad.
                        </p>
                    </div>
                </div>

                {/* Bloque de Galería de Imágenes */}
                <div className="order-2 w-full lg:row-span-2">
                    <div className="max-w-[500px] mx-auto lg:ml-auto flex flex-col items-center">
                        <div className="p-[2px] border border-primary/30 dark:border-white/10 rounded-[18px] shadow-2xl w-full">
                            <div 
                                className="flex gap-4 h-[400px] sm:h-[500px] w-full bg-background rounded-2xl overflow-hidden p-0"
                                style={{ transform: 'translateZ(0)', isolation: 'isolate' }}
                            >
                                
                                {/* Imagen Principal (Mosaico grande) */}
                            <div 
                                className="relative w-2/3 h-full rounded-2xl overflow-hidden group cursor-zoom-in"
                                style={{ transform: 'translateZ(0)', isolation: 'isolate' }}
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                    <Image
                                        key={`main-${currentIndex}`}
                                        src={allImages[currentIndex].src}
                                        alt={allImages[currentIndex].alt}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105 animate-in fade-in zoom-in-95"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                                </div>

                                {/* Thumbnails (Barra lateral derecha del bento) */}
                                <div className="w-1/3 flex flex-col gap-3 h-full">
                                    {allImages.map((img, idx) => {
                                        if (idx === currentIndex) return null; // No mostrar la activa en los thumbnails
                                        return (
                                            <div 
                                                key={idx}
                                                className="relative flex-1 rounded-xl overflow-hidden shadow-md cursor-pointer group"
                                                onMouseEnter={() => setCurrentIndex(idx)}
                                                onClick={() => setCurrentIndex(idx)}
                                            >
                                                <Image
                                                    src={img.src}
                                                    alt={img.alt}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors duration-300" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 font-medium pt-8">
                            Click para ampliar • Pasa el ratón para explorar
                        </p>
                    </div>
                </div>

                {/* Bloque de Mapa (Debajo del texto en desktop, al final en mobile) */}
                <div className="order-3 w-full lg:col-start-1">
                    <div className="relative h-[220px] lg:h-[180px] lg:mt-auto w-full rounded-2xl overflow-hidden shadow-xl border border-border/20 group">
                        <iframe
                            src="https://maps.google.com/maps?q=La%20Rioja%20416,%20Catamarca,%20Argentina&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Ubicación de la tienda"
                            className="grayscale hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100"
                        ></iframe>
                        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-primary/20 pointer-events-none">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-foreground">
                                La Rioja 416, Catamarca, Argentina
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Lightbox — rendered via Portal */}
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
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10000 }}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-9 h-9" />
                    </button>

                    <div className="relative flex-1 w-full flex items-center justify-center px-4 md:px-16" style={{ minHeight: 0 }}>
                        <Carousel opts={{ startIndex: currentIndex }} setApi={setLightboxApi} className="w-full h-full">
                            <CarouselContent className="h-full">
                                {allImages.map((img, i) => (
                                    <CarouselItem key={i} className="h-full flex items-center justify-center">
                                        <div className="relative w-full" style={{ height: '70vh' }}>
                                            <Image src={img.src} alt={img.alt} fill className="object-contain" sizes="95vw" />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2 bg-white/10 hover:bg-white/20 text-white border-white/20 size-10 md:size-12" />
                            <CarouselNext className="right-2 bg-white/10 hover:bg-white/20 text-white border-white/20 size-10 md:size-12" />
                        </Carousel>
                    </div>

                    <div className="shrink-0 flex gap-3 px-6 pb-2 pt-4 overflow-x-auto max-w-full">
                        {allImages.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => lightboxApi?.scrollTo(i)}
                                className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                    lightboxIndex === i
                                        ? 'border-primary opacity-100 scale-105 shadow-xl'
                                        : 'border-white/10 opacity-40 hover:opacity-80'
                                }`}
                            >
                                <Image src={img.src} alt="" fill className="object-cover" sizes="100px" />
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
}

