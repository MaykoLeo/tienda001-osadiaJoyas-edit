
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { type Product, type Category } from '@/lib/types';
import { Tag, Search } from 'lucide-react';

import { ProductCard } from '@/components/ProductCard';
import { OffersSection } from './OffersSection';
import { CategoryFilter } from './CategoryFilter';

const ITEMS_PER_PAGE = 6;

interface TiendaPageClientProps {
  initialProducts: Product[];
  allCategories: Category[];
  offerProducts: Product[];
  initialHasMore: boolean;
}

export function TiendaPageClient({ 
  initialProducts,
  allCategories, 
  offerProducts, 
  initialHasMore
}: TiendaPageClientProps) {

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const paramsStr = searchParams.toString();

  const { ref, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    // DS Fix: Prevent duplicate keys on initial load/filter change
    const uniqueInitial = initialProducts.filter((p, index, self) => 
      index === self.findIndex((t) => t.id === p.id)
    );
    setProducts(uniqueInitial);
    setPage(1);
    setHasMore(initialHasMore);
  }, [paramsStr, initialProducts, initialHasMore]); // Depend on the string representation

  const loadMoreProducts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    const nextPage = page + 1;
    
    const params = new URLSearchParams(paramsStr);
    params.set('page', String(nextPage));
    params.set('limit', String(ITEMS_PER_PAGE));

    try {
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch more products');
      
      const data = await response.json();
      const newProducts = data.products || [];

      setProducts(prev => {
        // DS Fix: Deduplicate by ID to prevent "duplicate key" React error
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = newProducts.filter((p: Product) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setPage(nextPage);
      setHasMore(newProducts.length > 0 && newProducts.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, paramsStr]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreProducts();
    }
  }, [inView, hasMore, loadMoreProducts]);

  const TitleIcon = query ? Search : Tag;
  const titleText = query 
    ? <>Resultados de Búsqueda para: <span className='text-primary'>'{query}'</span></>
    : 'Todos los Productos';

  return (
    <div className="space-y-8">
      {!query && <OffersSection products={offerProducts} />}

      {/* Mobile Category Filter */}
      <div className="lg:hidden px-4 sm:px-6">
        <div className="p-4 rounded-lg shadow-sm bg-card/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Categorías</h3>
          <CategoryFilter categories={allCategories} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start px-4 sm:px-6 lg:px-0">
        
        {/* Desktop Category Filter */}
        <aside className="lg:col-span-1 hidden lg:block p-4 rounded-lg shadow-sm bg-card/90 backdrop-blur-sm self-start top-24 sticky">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Categorías</h3>
          <CategoryFilter categories={allCategories} />
        </aside>

        <main id="productos-grid" className="lg:col-span-3 scroll-mt-24">
          <div className="flex items-center gap-4 mb-8">
            <TitleIcon className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {titleText}
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold">No se encontraron productos</h3>
              <p className="text-muted-foreground mt-2">Intenta con otra búsqueda o filtro.</p>
            </div>
          )}

          <div ref={ref} className="flex justify-center items-center py-8 w-full">
            {isLoading && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <p>Cargando más productos...</p>
              </div>
            )}
            {!hasMore && products.length > 0 && (
               <p className="text-muted-foreground">Has llegado al final</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
