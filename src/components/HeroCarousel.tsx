
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay"


export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  // --- MODIFICACIÓN: Usar imágenes locales optimizadas ---
  const carouselSlides = [
    {
        image: "/hero-1.webp", // Imagen local
        title: "Elegancia Atemporal",
        description: "Descubre piezas únicas que cuentan una historia. Joyería artesanal para el alma moderna.",
        buttonText: "Ver Colección",
        buttonLink: "/tienda",
        aiHint: "luxury perfume bottle",
    },
    {
        image: "/hero-2.webp", // Imagen local
        title: "Ofertas Exclusivas",
        description: "Aprovecha descuentos de hasta 20% en fragancias seleccionadas. ¡No te lo pierdas!",
        buttonText: "Comprar Ahora",
        buttonLink: "/tienda",
        aiHint: "perfume on sand",
    }
  ];

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
        setCurrent(api.selectedScrollSnap());
    };

    const onInteraction = () => {
        plugin.current.reset();
    };

    api.on("select", onSelect);
    api.on("pointerDown", onInteraction);


    return () => {
      api.off("select", onSelect);
      api.off("pointerDown", onInteraction);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <div>
        <Carousel 
            setApi={setApi} 
            opts={{ loop: true }} 
            plugins={[plugin.current]}
            className="w-full"
        >
            <CarouselContent>
                {carouselSlides.map((slide, index) => (
                    <CarouselItem key={index}>
                    <div className="relative text-center h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4">
                        <div className="absolute inset-0 z-0">
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            data-ai-hint={slide.aiHint}
                            priority={index === 0} // Prioriza la carga de la primera imagen
                            sizes="100vw" // La imagen ocupa todo el ancho de la ventana
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20"></div>
                        </div>
                        <div className="relative z-10 text-white max-w-4xl mx-auto">
                        <h1 className="text-5xl font-headline font-bold sm:text-6xl lg:text-7xl drop-shadow-lg">
                            {slide.title}
                        </h1>
                        <p className="mt-4 text-lg text-slate-100 drop-shadow-md">
                            {slide.description}
                        </p>
                        <Button asChild size="lg" className="mt-8 shadow-lg">
                            <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                        </Button>
                        </div>
                    </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20" />
        </Carousel>
        <div className="flex justify-center items-center gap-2 mt-4">
            {carouselSlides.map((_, index) => (
            <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                current === index ? 'w-4 bg-primary' : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                )}
                aria-label={`Ir a la diapositiva ${index + 1}`}
            />
            ))}
        </div>
    </div>
  );
}
