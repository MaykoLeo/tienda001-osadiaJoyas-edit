
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { Eye, ShoppingCart, Ban } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasStock = product.stock > 0;

  const calculateDiscount = () => {
    if (product.salePrice && product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <Card className={cn(
        // DS: card radius 8px, subtle shadow, architectural precision
        "flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 rounded-[8px] shadow-md",
        "border border-border",
        "h-full",
        !hasStock && "opacity-50"
    )}>
      <CardHeader className="p-0">
        <Link href={`/products/${product.id}`} className="block relative group">
          <div className="w-full aspect-square overflow-hidden bg-muted">
            <Image
              src={product.images[0] ?? 'https://placehold.co/600x600.png'}
              alt={product.name}
              width={600}
              height={600}
              className="aspect-square object-cover w-full transition-transform duration-500 group-hover:scale-105"
              data-ai-hint={product.aiHint}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* DS: Hover blur overlay — 4px backdrop-filter pulse during 500ms zoom transition */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:animate-blur-pulse bg-black/5" />

          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.salePrice && <Badge className='shadow-md rounded-[4px]' variant="destructive">OFERTA</Badge>}
            {discount > 0 && <Badge className='shadow-md rounded-[4px]' variant="destructive">{`${discount}% OFF`}</Badge>}
          </div>

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className='p-2 bg-background/80 rounded-full shadow-lg backdrop-blur-sm'>
                <Eye className='text-foreground w-4 h-4' />
            </div>
          </div>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 bg-card">
        <div className="flex-1">
          <Link href={`/products/${product.id}`} className="group">
            {/* DS: Playfair Display for product titles */}
            <CardTitle className="font-headline text-lg leading-tight tracking-[-0.02em] hover:text-primary transition-colors duration-300">
              {product.name}
            </CardTitle>
          </Link>
          {product.shortDescription && (
            <CardDescription className="mt-1 text-sm font-body">{product.shortDescription}</CardDescription>
          )}
        </div>

        {product.salePrice ? (
            <div className='flex items-baseline gap-2 mt-2'>
                <p className="text-2xl font-bold text-primary">
                    ${product.salePrice.toLocaleString('es-AR')}
                </p>
                <p className="text-lg font-medium text-muted-foreground line-through">
                    ${product.price.toLocaleString('es-AR')}
                </p>
            </div>
        ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">
                ${product.price.toLocaleString('es-AR')}
            </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 bg-card">
        {/* DS: Button — 4px radius, uppercase, tracking wide, 300ms gold transition */}
        <Button
          onClick={() => addToCart(product)}
          size="sm"
          className="w-full shadow-sm rounded-[4px] uppercase tracking-widest text-xs font-medium transition-all duration-300"
          disabled={!hasStock}
        >
          {hasStock
            ? <><ShoppingCart className="mr-2 h-4 w-4" /> Añadir al Carrito</>
            : <><Ban className="mr-2 h-4 w-4" />Sin Stock</>
          }
        </Button>
      </CardFooter>
    </Card>
  );
});
