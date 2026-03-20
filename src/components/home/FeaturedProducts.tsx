
import { ProductCard } from '@/components/ProductCard';
import { getFilteredProducts } from '@/lib/data/products';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

export async function FeaturedProducts() {
    noStore(); // Deshabilitar caché para siempre obtener datos frescos

    // Consultar directamente productos destacados con SQL
    const featuredProducts: Product[] = await getFilteredProducts({ featured: true, limit: 8 });

    return (
        <section id="featured" className="space-y-8">
            <div className="text-center space-y-3">
                <span className="text-primary uppercase tracking-[0.4em] text-[13px] font-headline font-bold">
                    Colección Seleccionada
                </span>
                <h2 className="text-5xl font-headline font-bold">Productos Destacados</h2>
                <p className="mt-4 text-muted-foreground/80 max-w-xl mx-auto font-body italic">Nuestra selección especial, elegida para vos.</p>
            </div>
            {featuredProducts.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4">
                    {featuredProducts.map((product) => (
                        <div key={product.id} className="w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No hay productos destacados para mostrar.</p>
                </div>
            )}
            <div className="text-center mt-12">
                <Button asChild size="lg" className="gap-2 px-10 py-6 text-lg font-semibold tracking-wider shadow-lg transform transition-transform duration-200 hover:scale-105">
                    <Link href="/tienda">
                        Ver Todos los Productos
                        <ArrowRight className='w-6 h-6' />
                    </Link>
                </Button>
            </div>
        </section>
    );
}
