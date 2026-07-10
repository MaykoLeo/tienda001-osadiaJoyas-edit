
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';
import { HeroCarousel } from '@/components/HeroCarousel';
import { CategoryDiscountBanner } from '@/components/home/CategoryDiscountBanner';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// --- Componentes de Carga (Skeletons) ---
const FeaturedProductsSkeleton = () => (
    <div className="space-y-8">
        <div className="text-center">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-1/3 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
    </div>
);

const SectionSkeleton = () => (
    <div className="space-y-12 py-5">
        <div className="text-center">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-2/3 mx-auto mt-2" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
    </div>
);

// --- Carga Dinámica de Componentes (Sintaxis Corregida) ---
const FeaturedProducts = dynamic(() => import('@/components/home/FeaturedProducts').then(mod => mod.FeaturedProducts));
const WhyChooseUs = dynamic(() => import('@/components/home/WhyChooseUs').then(mod => mod.WhyChooseUs));
const AboutUs = dynamic(() => import('@/components/home/AboutUs').then(mod => mod.AboutUs));
const OurStore = dynamic(() => import('@/components/home/OurStore').then(mod => mod.OurStore));


export default async function Home() {
    return (
        <div className="space-y-16">
            {/* Hero Carousel Section - Se carga inmediatamente */}
            <section className="w-full -mx-px">
                <HeroCarousel />
            </section>

            {/* Contenedor para el contenido que se cargará de forma diferida */}
            <div className="container">

                {/* Banners de descuento por categoría (máx 3) */}
                <Suspense fallback={null}>
                    <CategoryDiscountBanner />
                </Suspense>

                <Suspense fallback={<FeaturedProductsSkeleton />}>
                    <FeaturedProducts />
                </Suspense>

                <Separator className="w-1/2 mx-auto my-8" />

                {/* Instagram Section - Es ligera, no necesita lazy loading */}
                <section id="instagram">
                    <div className="flex items-center justify-center gap-8">
                        <Separator className="flex-1" />
                        <div className="text-center flex-shrink-0">
                            <Button asChild variant="ghost" className="group h-auto rounded-full px-6 py-2 text-2xl font-headline text-muted-foreground tracking-wider hover:bg-accent hover:text-accent-foreground transition-all [&_svg]:size-7">
                                <Link href="https://www.instagram.com/osadia.cta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4">
                                    <InstagramIcon className="text-muted-foreground transition-all duration-300 group-hover:text-current group-hover:scale-110" />
                                    <span className="group-hover:translate-x-1 transition-transform">osadia.cta</span>
                                </Link>
                            </Button>
                        </div>
                        <Separator className="flex-1" />
                    </div>
                </section>

                <Separator className="w-1/2 mx-auto my-8" />

                <Suspense fallback={<SectionSkeleton />}>
                    <WhyChooseUs />
                </Suspense>

                <Separator className="w-1/2 mx-auto my-8" />

                <Suspense fallback={<SectionSkeleton />}>
                    <AboutUs />
                </Suspense>

                <Separator className="w-1/2 mx-auto my-8" />

                <Suspense fallback={<SectionSkeleton />}>
                    <OurStore />
                </Suspense>
            </div>
        </div>
    );
}
