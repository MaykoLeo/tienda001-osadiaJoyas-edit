
import { ProductCard } from '@/components/ProductCard';
import { type Product } from '@/lib/types';
import { Percent } from 'lucide-react';

export function OffersSection({ products }: { products: Product[] }) {
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
        <div className="flex flex-wrap justify-center gap-8">
          {products.map(product => (
            <div key={product.id} className="w-full max-w-xs flex flex-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No hay ofertas especiales en este momento.
        </p>
      )}
    </section>
  );
}
