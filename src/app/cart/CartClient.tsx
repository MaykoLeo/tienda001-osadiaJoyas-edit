
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, Ticket, XCircle, Loader2, Info, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, KeyboardEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCouponByCode } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { verifyCartPrices, VerificationResult } from '@/lib/actions';


export function CartClient() {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, subtotal, cartCount, appliedCoupon, applyCoupon, removeCoupon, discount, isCouponApplicable, replaceCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true); // Nuevo estado para la verificación
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  // --- EFECTO PARA VERIFICAR PRECIOS AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    const verifyPrices = async () => {
      if (cartItems.length === 0) {
          setIsVerifying(false);
          return;
      }
      
      setIsVerifying(true);
      try {
        // Prepara los items para la server action
        const itemsToVerify = cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceInCart: item.product.salePrice ?? item.product.price,
        }));

        const result = await verifyCartPrices(itemsToVerify);
        setVerificationResult(result);

        if (result.hasChanges) {
            replaceCart(result.updatedCartItems);
            toast({
                title: "Carrito Actualizado",
                description: "Algunos productos en tu carrito cambiaron. Por favor, revisa los detalles.",
                variant: "default",
            });
        }

      } catch (error) {
        console.error("Error al verificar los precios del carrito:", error);
        toast({
            title: "Error de Verificación",
            description: "No pudimos verificar los precios de tu carrito. Inténtalo de nuevo.",
            variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se ejecuta solo una vez al cargar el componente

  // --- LÓGICA DE CÁLCULO DE TOTALES (SIN CAMBIOS) ---
  const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const offerDiscount = originalSubtotal - subtotal;
  const couponDiscount = discount;
  const cartTotal = subtotal - couponDiscount;

  // --- MANEJADORES (SIN CAMBIOS) ---
  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setIsLoadingCoupon(true);
      try {
        const coupon = await getCouponByCode(couponCode);
        if (coupon) {
            applyCoupon(coupon);
        } else {
            toast({ title: "Error", description: "El cupón no es válido o ha expirado.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      }
      setIsLoadingCoupon(false);
      setCouponCode("");
  }

  const handleNumericKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-'].includes(e.key)) {
          e.preventDefault();
      }
  };

  const handleQuantityChange = (productId: number, value: string) => {
    if (value === '') {
        updateQuantity(productId, 0);
    } else {
        const newQuantity = parseInt(value, 10);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            updateQuantity(productId, newQuantity);
        }
    }
  };

  const handleCheckout = () => {
    const itemOverStock = cartItems.find(item => item.quantity > item.product.stock);
    if (itemOverStock) {
      toast({
        title: "Stock Insuficiente",
        description: `Disculpe las molestias. Para \"${itemOverStock.product.name}\", la cantidad ingresada supera el stock disponible.`,
        variant: "destructive",
      });
      return;
    }

    const invalidItems = cartItems.filter(item => item.quantity <= 0);
    if (invalidItems.length > 0) {
        toast({
            title: "Cantidad inválida",
            description: `Por favor, asegúrate de que todos los productos tengan una cantidad de al menos 1. El producto \"${invalidItems[0].product.name}\" tiene una cantidad inválida.`,
            variant: "destructive"
        });
        return;
    }

    if (cartCount <= 0) {
        toast({
            title: "Carrito vacío",
            description: "No puedes proceder al pago con el carrito vacío.",
            variant: "destructive"
        });
        return;
    }
    router.push('/checkout');
  };

  // --- RENDERIZADO ---

  if (isVerifying) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Verificando tu carrito...</p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline font-bold mb-8">Tu Carrito de Compras</h1>

      {verificationResult?.hasChanges && verificationResult.messages.length > 0 && (
        <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Tu carrito ha sido actualizado</AlertTitle>
            <AlertDescription className="text-blue-700">
                <ul className="list-disc pl-5 mt-1 space-y-1">
                    {verificationResult.messages.map((msg, index) => <li key={index}>{msg}</li>)}
                </ul>
            </AlertDescription>
        </Alert>
      )}

      {cartItems.length === 0 ? (
        <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center gap-4">
                <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
                <p className="text-muted-foreground">Parece que todavía no has añadido nada.</p>
                <Button asChild className="mt-4">
                    <Link href="/tienda">Empezar a comprar</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map(({ product, quantity }) => (
              <Card key={product.id} className="flex items-center p-3">
                <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/80x80/EFEFEF/333333?text=Sin+Imagen"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                </div>
                <div className="flex-1 ml-3">
                  <Link href={`/products/${product.id}`} className="font-semibold hover:text-primary text-base leading-tight">{product.name}</Link>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="font-semibold text-primary">{formatCurrency(product.salePrice ?? product.price)}</p>
                    {product.salePrice && product.salePrice < product.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.price)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Input
                    type="number"
                    min="0"
                    max="500"
                    value={quantity === 0 ? '' : quantity}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    className="w-16 h-9 text-center"
                    aria-label={`Cantidad de ${product.name}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)} aria-label={`Quitar ${product.name} del carrito`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCouponApplicable && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            No puedes aplicar cupones cuando hay productos en oferta en tu carrito.
                        </AlertDescription>
                    </Alert>
                )}
                {!appliedCoupon && (
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Código de Cupón" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                            disabled={!isCouponApplicable}
                        />
                        <Button onClick={handleApplyCoupon} disabled={isLoadingCoupon || !couponCode || !isCouponApplicable}>
                            {isLoadingCoupon ? <Loader2 className="animate-spin" /> : "Aplicar"}
                        </Button>
                    </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(originalSubtotal)}</span>
                </div>
                
                {offerDiscount > 0 && (
                  <div className="flex justify-between items-center text-primary">
                      <span>Descuentos</span>
                      <span>-{formatCurrency(offerDiscount)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-primary">
                      <div className="flex items-center gap-2">
                          <span>Descuento</span>
                          {appliedCoupon && (
                            <div className='flex items-center gap-1 text-xs'>
                              (<Ticket className="h-3 w-3"/> {appliedCoupon.code}
                              <button onClick={() => {removeCoupon(); toast({title: "Cupón removido"})}} className="text-destructive"><XCircle className="h-3 w-3"/></button>)
                            </div>
                          )}
                      </div>
                      <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch">
                <Button onClick={handleCheckout} size="lg" className="w-full">
                  Comprar
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full mt-2">
                    <Link href="/tienda">
                        Seguir Comprando
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
