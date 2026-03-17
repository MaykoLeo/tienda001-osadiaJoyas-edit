"use client";

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '../ui/button';

export function OurStore() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    const images = [
        { src: "/local/foto1.jpg", alt: "Interior del local - Vista 1" },
        { src: "/local/foto2.jpg", alt: "Interior del local - Vista 2" },
        { src: "/local/foto3.jpg", alt: "Interior del local - Vista 3" },
    ];

    return (
        <section id="our-store" className="py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-start">

                {/* Columna Izquierda: Texto + Mapa */}
                <div className="space-y-10 order-2 lg:order-1">
                    <div className="space-y-3">
                        <span className="text-primary uppercase tracking-[0.4em] text-[10px] font-headline font-bold block">
                            Sobre Nosotros
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

                    {/* Mapa de Google Maps */}
                    <div className="relative h-[280px] w-full rounded-2xl overflow-hidden shadow-xl border border-border/20 group">
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
                        {/* Pill de dirección superpuesto */}
                        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-primary/20 pointer-events-none">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-foreground">
                                La Rioja 416, Catamarca, Argentina
                            </span>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Carrusel interactivo */}
                <div className="order-1 lg:order-2 space-y-5">
                    <div className="relative group/carousel mx-auto max-w-[460px]">
                        {/* Contenedor del carrusel */}
                        <div className="overflow-hidden rounded-2xl shadow-2xl cursor-pointer" ref={emblaRef}>
                            <div className="flex">
                                {images.map((img, index) => (
                                    <div className="relative flex-[0_0_100%] min-w-0" key={index}>
                                        <div
                                            className="relative aspect-[4/5] w-full overflow-hidden"
                                            onClick={scrollNext}
                                        >
                                            <Image
                                                src={img.src}
                                                alt={img.alt}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover/carousel:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botones de navegación flotantes */}
                        <div className="absolute -bottom-5 right-6 flex gap-3 z-20">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 rounded-full bg-background/90 backdrop-blur-md border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-xl transition-all active:scale-95 disabled:opacity-40"
                                onClick={scrollPrev}
                                disabled={!prevBtnEnabled}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 rounded-full bg-background/90 backdrop-blur-md border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-xl transition-all active:scale-95"
                                onClick={scrollNext}
                                disabled={!nextBtnEnabled}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Indicadores de posición (dots) */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => emblaApi?.scrollTo(index)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                        index === selectedIndex
                                            ? 'bg-white w-4'
                                            : 'bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 font-medium pt-4">
                        Haz clic en las flechas o en la imagen para navegar
                    </p>
                </div>
            </div>
        </section>
    );
}
