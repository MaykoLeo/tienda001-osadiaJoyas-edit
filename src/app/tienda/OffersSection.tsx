import { ProductCard } from '@/components/ProductCard';
import { type Product } from '@/lib/types';
import { Percent, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function OffersSection({ products }: { products: Product[] }) {
  const [visibleCount, setVisibleCount] = useState(4);
  const hasMore = products.length > visibleCount;

  const showMore = () => setVisibleCount(prev => prev + 4);

  return (
    <section className="bg-muted/50 rounded-lg p-8 text-center">
      <div className="flex justify-center items-center mb-4">
        <Percent className="h-10 w-10 text-primary" />
        <h2 className="text-4xl font-bold tracking-tight text-foreground ml-4">
          Ofertas Especiales
        </h2>
      </div>
      <p className="text-muted-foreground mb-8">
        ¡Aprovecha nuestros descuentos exclusivos por tiempo limitado!
      </p>

      {products.length > 0 ? (
        <div className="space-y-10">
          <div className="flex flex-wrap justify-center gap-5">
            {products.slice(0, visibleCount).map(product => (
              <div key={product.id} className="w-full sm:w-[calc(50%-10px)] xl:w-[calc(33.333%-14px)] 2xl:w-[calc(25%-15px)] max-w-[280px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {hasMore && (
            <Button 
              variant="outline" 
              onClick={showMore}
              className="mt-4 gap-2 border-primary/20 hover:bg-primary/5 rounded-full px-8"
            >
              <Plus className="w-4 h-4" />
              Cargar Más Ofertas
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No hay ofertas especiales en este momento.
        </p>
      )}
    </section>
  );
}
