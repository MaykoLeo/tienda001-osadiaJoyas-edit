"use client";

import Image from 'next/image';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OurStore() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const allImages = [
        { src: "/local/foto1.JPG", alt: "Interior del local - Vista 1" },
        { src: "/local/foto2.JPG", alt: "Interior del local - Vista 2" },
        { src: "/local/foto3.JPG", alt: "Interior del local - Vista 3" },
        { src: "/local/foto1.JPG", alt: "Interior del local - Vista 4" }, // Duplicate for demo
    ];

    return (
        <section id="our-store" className="py-12 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-10 items-center">

                {/* Columna Izquierda: Texto + Mapa */}
                <div className="space-y-10 order-2 lg:order-1">
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

                    {/* Mapa de Google Maps */}
                    <div className="relative h-[220px] w-full rounded-2xl overflow-hidden shadow-xl border border-border/20 group">
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

                {/* Columna Derecha: Bento Grid Interactivo */}
                <div className="order-1 lg:order-2 w-full">
                    <div className="flex gap-4 h-[400px] sm:h-[500px] w-full max-w-[500px] mx-auto lg:ml-auto">
                        
                        {/* Imagen Principal (Mosaico grande) */}
                        <div className="relative w-2/3 h-full rounded-2xl overflow-hidden shadow-2xl group">
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
                    <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 font-medium pt-8">
                        Pasa el ratón sobre las imágenes para explorar
                    </p>
                </div>
            </div>
        </section>
    );
}

