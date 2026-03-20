
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { ShippingCalculator } from './ShippingCalculator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function CartSidebar() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, isSidebarOpen, setIsSidebarOpen, totalPrice, shippingCost } = useCart();

  return (
    <Sheet
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
    >
      <SheetContent
        className="flex w-full flex-col pr-0 sm:max-w-lg"
        onInteractOutside={(event: Event) => {
          const target = event.target as HTMLElement;
          // data-radix-toast-viewport is the attribute of the toast container
          // toast-close es el atributo del botón de cierre del toast
          if (target.closest('[data-radix-toast-viewport]') || target.closest('[toast-close]')) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle>Mi Carrito</SheetTitle>
          <SheetDescription>Completa tu compra o sigue explorando la tienda.</SheetDescription>
        </SheetHeader>

        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1 pr-6">
              <div className="flex w-full flex-col gap-5 my-6">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="space-y-3">
                    <div className="flex justify-start items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded">
                        <Image
                          src={product.images[0] ?? "https://placehold.co/100x100.png"}
                          alt={product.name}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          fill
                          className="absolute object-cover"
                          loading="lazy"
                          data-ai-hint={product.aiHint}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 self-start text-sm">
                        <Link
                          href={`/products/${product.id}`}
                          className="line-clamp-2 hover:text-primary"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {product.name}
                        </Link>
                        <span className="line-clamp-1 text-muted-foreground">
                          ${(product.salePrice ?? product.price).toLocaleString('es-AR')} c/u
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => updateQuantity(product.id, parseInt(e.target.value))}
                            className="w-20 h-8 text-center"
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="space-y-4 pr-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="shipping" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2">
                    <span className="text-sm font-medium">Calculá el costo de envío</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ShippingCalculator />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium text-foreground">
                    {shippingCost !== null 
                      ? (shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-AR')}`) 
                      : 'Calculá el envío'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
            <SheetFooter className="gap-2 pr-6">
              <Button asChild className="w-full">
                <Link href="/cart" onClick={() => setIsSidebarOpen(false)}>Iniciar Compra</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setIsSidebarOpen(false)}>
                Seguir Comprando
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4">
            <ShoppingBag className="w-20 h-20 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-xl font-semibold">Tu carrito está vacío</h3>
              <p className="text-sm text-muted-foreground">
                Añade productos para poder verlos aquí.
              </p>
            </div>
            <Button asChild>
              <Link href="/tienda" onClick={() => setIsSidebarOpen(false)}>
                Empezar a comprar
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
