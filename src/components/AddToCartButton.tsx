'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { type Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2, Check } from 'lucide-react';

export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (isAdding || added) return;

    setIsAdding(true);
    setTimeout(() => {
      addToCart(product, 1);
      setIsAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000); // Reset after 2s
    }, 500); // Simulate network delay
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || added}
      className={`w-full transition-all duration-300 ${className}`}
      variant={added ? 'secondary' : 'default'}
    >
      {isAdding ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : added ? (
        <>
          <Check className="h-5 w-5 mr-2" />
          ¡Añadido!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" />
          Añadir al Carrito
        </>
      )}
    </Button>
  );
}
