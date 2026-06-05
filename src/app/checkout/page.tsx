"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { verifyCartPrices, VerificationResult } from "@/lib/actions";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useMemo } from "react";
import { Loader2, ShoppingCart, CreditCard, AlertTriangle, Truck, Store, HandCoins } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { createOrder } from "@/lib/data";
import { DeliveryMethod, PaymentType } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useShippingStore } from "@/store/shipping-store";

const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Buenos Aires (Ciudad Autónoma)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

const checkoutSchema = z.object({
  firstName: z.string().trim().min(2, "El nombre es requerido."),
  lastName: z.string().trim().min(2, "El apellido es requerido."),
  email: z.string().trim().email("El email ingresado no es válido."),
  phone: z.string().trim().min(10, "El teléfono debe tener al menos 10 dígitos."),
  // Shipping fields
  shippingStreet: z.string().optional(),
  shippingNumber: z.string().optional(),
  shippingFloor: z.string().optional(),
  shippingApartment: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingLocality: z.string().optional(),
  shippingProvince: z.string().optional(),
  // Pickup fields
  pickupName: z.string().optional(),
  pickupDNI: z.string().optional(),
  deliveryMethod: z.string(),
  paymentType: z.string(),
})
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'shipping') {
      if (!data.shippingStreet || data.shippingStreet.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shippingStreet'], message: 'La calle es requerida.' });
      }
      if (!data.shippingNumber || data.shippingNumber.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shippingNumber'], message: 'El número es requerido.' });
      }
      if (!data.shippingPostalCode || data.shippingPostalCode.trim().length < 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shippingPostalCode'], message: 'El código postal es requerido.' });
      }
      if (!data.shippingLocality || data.shippingLocality.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shippingLocality'], message: 'La localidad es requerida.' });
      }
      if (!data.shippingProvince || data.shippingProvince.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shippingProvince'], message: 'La provincia es requerida.' });
      }
    }
    if (data.deliveryMethod === 'pickup' || data.deliveryMethod === 'pay_in_store') {
      if (!data.pickupName || data.pickupName.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupName'], message: 'El nombre y apellido de quien retira son requeridos.' });
      }
      const trimmedDNI = data.pickupDNI ? data.pickupDNI.trim() : '';
      if (!/^\d{7,8}$/.test(trimmedDNI)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupDNI'], message: 'El DNI debe tener entre 7 y 8 dígitos numéricos.' });
      }
    }
  });


type CheckoutFormData = z.infer<typeof checkoutSchema>;

function CheckoutForm() {
  const { cartItems, subtotal, appliedCoupon, cartCount, clearCart, replaceCart } = useCart();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const { shippingCost, postalCode: shippingPostalCodeStore, setPostalCode, reset, setShippingCost, setError, setLoading, status, error } = useShippingStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [shippingInfo, setShippingInfo] = useState<{ productName?: string; deliveryTimeMin?: string; deliveryTimeMax?: string } | null>(null);

  useEffect(() => {
    const verifyPrices = async () => {
      if (cartItems.length === 0) { setIsVerifying(false); return; }
      setIsVerifying(true);
      try {
        const itemsToVerify = cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceInCart: item.product.salePrice ?? item.product.price,
        }));
        const result = await verifyCartPrices(itemsToVerify);
        setVerificationResult(result);
        if (result.hasChanges) {
          replaceCart(result.updatedCartItems);
          toast({ title: "El carrito fue actualizado", description: "Algunos productos cambiaron. Revisa el resumen antes de continuar." });
        }
      } catch (error) {
        toast({ title: "Error de Verificación", description: "No pudimos verificar los precios de tu carrito. Inténtalo de nuevo.", variant: "destructive" });
      } finally {
        setIsVerifying(false);
      }
    };
    verifyPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentType = useMemo(() => {
    return deliveryMethod === 'pay_in_store' ? 'Pago en Local' : 'QR / Tarjeta';
  }, [deliveryMethod]);

  const DEPOSIT_PERCENTAGE = 0.30;

  const {
    originalSubtotal, productDiscount, couponDiscount, localPaymentDiscount, finalTotalPrice, totalDiscount, depositAmount, remainingAmount
  } = useMemo(() => {
    const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const productDiscount = originalSubtotal - subtotal;
    let couponDiscountValue = 0;
    if (appliedCoupon) {
      couponDiscountValue = appliedCoupon.discountType === 'percentage'
        ? subtotal * (appliedCoupon.discountValue / 100)
        : appliedCoupon.discountValue;
    }
    const subtotalAfterCoupons = subtotal - couponDiscountValue;
    const isPayInStore = deliveryMethod === 'pay_in_store';
    const localPaymentDiscountValue = isPayInStore ? subtotalAfterCoupons * 0.20 : 0;
    const shippingCostValue = deliveryMethod === 'shipping' ? (shippingCost ?? 0) : 0;
    const finalTotalPrice = subtotalAfterCoupons - localPaymentDiscountValue + shippingCostValue;
    const totalDiscount = productDiscount + couponDiscountValue + localPaymentDiscountValue;
    const depositAmount = isPayInStore ? Math.round(finalTotalPrice * DEPOSIT_PERCENTAGE * 100) / 100 : 0;
    const remainingAmount = isPayInStore ? Math.round((finalTotalPrice - depositAmount) * 100) / 100 : 0;
    return { originalSubtotal, productDiscount, couponDiscount: couponDiscountValue, localPaymentDiscount: localPaymentDiscountValue, finalTotalPrice, totalDiscount, depositAmount, remainingAmount };
  }, [cartItems, subtotal, appliedCoupon, deliveryMethod, shippingCost, DEPOSIT_PERCENTAGE]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      shippingStreet: "", shippingNumber: "", shippingFloor: "", shippingApartment: "",
      shippingPostalCode: shippingPostalCodeStore || "", shippingLocality: "", shippingProvince: "",
      pickupName: "", pickupDNI: "", deliveryMethod: 'shipping', paymentType: 'QR / Tarjeta'
    },
  });

  useEffect(() => {
    form.setValue('deliveryMethod', deliveryMethod);
    form.setValue('paymentType', paymentType);
    if (deliveryMethod !== 'shipping') {
      reset();
      form.setValue('shippingPostalCode', '');
    }
  }, [deliveryMethod, form, reset, paymentType]);

  useEffect(() => {
    if (shippingPostalCodeStore) { form.setValue('shippingPostalCode', shippingPostalCodeStore); }
  }, [shippingPostalCodeStore, form]);

  useEffect(() => {
    const checkAdBlocker = async () => {
      try {
        await fetch(new Request('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')).catch(() => { setShowAdBlockerWarning(true); });
      } catch { setShowAdBlockerWarning(true); }
    };
    checkAdBlocker();
  }, []);

  // Shipping Calculator inline
  const handleCalculateShipping = async () => {
    const postalCode = form.getValues('shippingPostalCode');
    if (!postalCode || postalCode.trim().length < 4) {
      form.setError('shippingPostalCode', { message: 'Ingresa un código postal válido para calcular el envío.' });
      return;
    }
    setLoading();
    setShippingInfo(null);
    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCodeDestination: postalCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo calcular el envío.');
      setShippingCost(data.shippingCost, postalCode.trim());
      setShippingInfo({ productName: data.productName, deliveryTimeMin: data.deliveryTimeMin, deliveryTimeMax: data.deliveryTimeMax });
      form.clearErrors('shippingPostalCode');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage);
    }
  };

  const handleCheckoutSubmit = async (values: CheckoutFormData) => {
    setIsLoading(true);
    try {
      if (cartCount === 0) throw new Error("El carrito está vacío.");
      if (deliveryMethod === 'shipping' && (shippingCost === null || shippingCost === undefined)) {
        throw new Error("Por favor, calcula el costo de envío antes de continuar.");
      }

      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        image: item.product.images[0] ?? '',
        quantity: item.quantity,
        priceAtPurchase: item.product.salePrice ?? item.product.price,
        originalPrice: (item.product.salePrice && item.product.salePrice < item.product.price) ? item.product.price : null,
      }));

      const orderData = {
        customerFirstName: values.firstName,
        customerLastName: values.lastName,
        customerEmail: values.email,
        customerPhone: values.phone,
        total: finalTotalPrice,
        items: orderItems,
        couponCode: appliedCoupon?.code,
        discountAmount: totalDiscount,
        deliveryMethod: deliveryMethod,
        paymentType: paymentType as PaymentType,
        shippingStreet: values.shippingStreet,
        shippingNumber: values.shippingNumber,
        shippingFloor: values.shippingFloor,
        shippingApartment: values.shippingApartment,
        shippingPostalCode: values.shippingPostalCode,
        shippingLocality: values.shippingLocality,
        shippingProvince: values.shippingProvince,
        pickupName: values.pickupName,
        pickupDni: values.pickupDNI,
      };

      if (paymentType === 'Pago en Local') {
        // Crear orden con status pending_deposit
        const depositAmountCalc = Math.round(finalTotalPrice * DEPOSIT_PERCENTAGE * 100) / 100;
        const remainingAmountCalc = Math.round((finalTotalPrice - depositAmountCalc) * 100) / 100;

        const orderResponse = await createOrder({
          ...orderData,
          status: 'pending_deposit',
          depositAmount: depositAmountCalc,
          remainingAmount: remainingAmountCalc,
        });
        if (orderResponse.error || !orderResponse.orderId) throw new Error(orderResponse.error || 'No se pudo generar el pedido.');

        // Llamar al endpoint seguro de seña — solo enviamos orderId, el servidor calcula el monto
        const depositResponse = await fetch('/api/create-deposit-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderResponse.orderId }),
        });

        if (!depositResponse.ok) {
          const errorData = await depositResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error del servidor: ${depositResponse.status}`);
        }

        const depositData = await depositResponse.json();
        if (!depositData.init_point) throw new Error('No se pudo obtener el link de pago de la seña.');

        clearCart();
        window.location.href = depositData.init_point;
      } else {
        const orderResponse = await createOrder({ ...orderData, status: 'pending_payment' });
        if (orderResponse.error || !orderResponse.orderId) throw new Error(orderResponse.error || "No se pudo crear la orden.");

        localStorage.setItem('pendingOrderId', String(orderResponse.orderId));

        const mpResponse = await fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems,
            orderId: orderResponse.orderId,
            shippingCost: deliveryMethod === 'shipping' ? shippingCost : 0,
            discountAmount: couponDiscount,
            couponCode: appliedCoupon?.code
          }),
        });

        if (!mpResponse.ok) {
          const errorData = await mpResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error del servidor: ${mpResponse.status}`);
        }

        const preferenceData = await mpResponse.json();
        if (!preferenceData.init_point) throw new Error("No se pudo obtener el link de pago.");

        window.location.href = preferenceData.init_point;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({ title: "Error al finalizar la compra", description: (error as Error).message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Verificando tu carrito...</p>
      </div>
    );
  }

  if (cartCount === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <Button onClick={() => router.push('/tienda')}>Ir a la tienda</Button>
      </div>
    );
  }

  const renderOrderSummary = () => {
    const hasProductDiscount = productDiscount > 0;
    const showShipping = deliveryMethod === 'shipping';
    const isPayInStore = deliveryMethod === 'pay_in_store';

    return (
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <h2 className="text-3xl font-headline font-bold mb-6">Resumen de tu compra</h2>
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-4">
              {cartItems.map(item => {
                const hasSale = item.product.salePrice && item.product.salePrice < item.product.price;
                const itemTotal = (item.product.salePrice ?? item.product.price) * item.quantity;
                const originalItemTotal = item.product.price * item.quantity;
                return (
                  <div key={item.product.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                        <Image src={item.product.images[0] ?? "https://placehold.co/100x100.png"} alt={item.product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="font-medium">{formatCurrency(itemTotal)}</p>
                      {hasSale && <p className="text-sm text-muted-foreground line-through">{formatCurrency(originalItemTotal)}</p>}
                    </div>
                  </div>
                );
              })}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className={hasProductDiscount ? "line-through text-muted-foreground" : ""}>{formatCurrency(originalSubtotal)}</p>
                </div>
                {hasProductDiscount && (<div className="flex justify-between"><p className="text-muted-foreground">Subtotal c/ Dtos.</p><p>{formatCurrency(subtotal)}</p></div>)}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <div className="flex items-center gap-2">
                      <span>Descuento Cupón</span>
                      {appliedCoupon && <span className='text-xs font-medium'>({appliedCoupon.code})</span>}
                    </div>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {isPayInStore && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Dto. pago en local (20%)</span>
                    <span>-{formatCurrency(localPaymentDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Envío</p>
                  <p>{showShipping ? (shippingCost !== null ? formatCurrency(shippingCost) : "Calcula tu envío") : "No aplica"}</p>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-xl"><p>Total</p><p>{formatCurrency(finalTotalPrice)}</p></div>
                {isPayInStore && (
                  <>
                    <Separator className="my-2" />
                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-2">
                      <p className="text-sm font-semibold text-primary">Desglose de pago:</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Seña ahora (30% online):</span>
                        <span className="font-bold text-primary">{formatCurrency(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Saldo al retirar (70%):</span>
                        <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Pagos seguros procesados por Mercado Pago</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getButtonText = () => {
    if (isLoading) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>;
    if (paymentType === 'Pago en Local') return "Pagar Seña (30%) con Mercado Pago";
    return "Continuar y Pagar con Mercado Pago";
  };

  return (
    <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto py-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-headline font-bold mb-6">Finalizar Compra</h1>

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

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>1. Elige cómo quieres obtener tu pedido</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Label htmlFor="shipping" className="cursor-pointer flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="shipping" id="shipping" className="sr-only" /><Truck className="mb-3 h-6 w-6" />Envío a Domicilio</Label>
                <Label htmlFor="pickup" className="cursor-pointer flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="pickup" id="pickup" className="sr-only" /><Store className="mb-3 h-6 w-6" />Retiro en Local</Label>
                <Label htmlFor="pay_in_store" className="cursor-pointer flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="pay_in_store" id="pay_in_store" className="sr-only" /><HandCoins className="mb-3 h-6 w-6" /><span className="text-center">Pago en Local<br />(20% OFF)</span></Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {showAdBlockerWarning && (<Card className="border-yellow-200 bg-yellow-50 mb-6"><CardContent className="p-4"><div className="flex items-center gap-2 text-yellow-800"><AlertTriangle className="h-5 w-5" /><p className="text-sm"><strong>Importante:</strong> Detectamos un bloqueador de anuncios activo. Por favor desactívalo para este sitio para asegurar que el sistema de pagos funcione correctamente.</p></div></CardContent></Card>)}

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-96 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground">Procesando tu orden...</p></div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCheckoutSubmit)} className="space-y-6">
                {/* --- DATOS DE CONTACTO --- */}
                <Card>
                  <CardHeader><CardTitle>2. Completa tus datos de contacto</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>Nombre(s)</FormLabel><FormControl><Input {...field} placeholder="Ejemplo: María" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} placeholder="Ejemplo: García" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} placeholder="Ejemplo: maria@email.com" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} placeholder="Ejemplo: 1122334455" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* --- INFORMACIÓN DE ENVÍO --- */}
                {deliveryMethod === 'shipping' && (
                  <Card>
                    <CardHeader><CardTitle>3. Información de Envío</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FormField control={form.control} name="shippingStreet" render={({ field }) => (
                            <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} placeholder="Ejemplo: Av. Corrientes" /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="shippingNumber" render={({ field }) => (
                          <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} placeholder="Ejemplo: 1234" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="shippingFloor" render={({ field }) => (
                          <FormItem><FormLabel>Piso <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel><FormControl><Input {...field} placeholder="Ejemplo: 3" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="shippingApartment" render={({ field }) => (
                          <FormItem><FormLabel>Departamento <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel><FormControl><Input {...field} placeholder="Ejemplo: B" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="shippingLocality" render={({ field }) => (
                          <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input {...field} placeholder="Ejemplo: Buenos Aires" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="shippingProvince" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provincia</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ARGENTINA_PROVINCES.map(p => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      {/* Código Postal + Calcular en una sola fila */}
                      <div>
                        <FormField control={form.control} name="shippingPostalCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Postal</FormLabel>
                            <div className="flex items-start gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ejemplo: 1001"
                                  className="max-w-xs"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length >= 4) {
                                      setPostalCode(e.target.value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-10 shrink-0"
                                onClick={handleCalculateShipping}
                                disabled={status === 'loading'}
                              >
                                {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calcular envío'}
                              </Button>
                            </div>
                            <FormMessage />
                            {/* Resultado del cálculo */}
                            {status === 'error' && error && (
                              <p className="text-sm text-destructive mt-1">{error}</p>
                            )}
                            {status === 'success' && shippingCost !== null && (
                              <div className="mt-2 text-sm text-green-600">
                                <span>✓ Costo de envío: <strong>{formatCurrency(shippingCost)}</strong></span>
                                {shippingInfo?.productName && (
                                  <p className="text-xs text-muted-foreground">
                                    {shippingInfo.productName}
                                    {shippingInfo.deliveryTimeMin && shippingInfo.deliveryTimeMax && ` · ${shippingInfo.deliveryTimeMin} a ${shippingInfo.deliveryTimeMax} días hábiles`}
                                  </p>
                                )}
                              </div>
                            )}
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* --- INFORMACIÓN DE RETIRO --- */}
                {(deliveryMethod === 'pickup' || deliveryMethod === 'pay_in_store') && (
                  <Card>
                    <CardHeader><CardTitle>3. Información de Retiro</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">Por favor, completa los datos de la persona que va a retirar el pedido. El DNI será solicitado al momento de la entrega.</p>
                      <FormField control={form.control} name="pickupName" render={({ field }) => (
                        <FormItem><FormLabel>Nombre y Apellido de Quien Retira</FormLabel><FormControl><Input {...field} placeholder="Ejemplo: Juan Pérez" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="pickupDNI" render={({ field }) => (
                        <FormItem>
                          <FormLabel>DNI de Quien Retira</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ejemplo: 12345678"
                              maxLength={8}
                              inputMode="numeric"
                              onChange={(e) => { const value = e.target.value; if (/^\d*$/.test(value)) { field.onChange(value); } }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={isLoading || (deliveryMethod === 'shipping' && shippingCost === null)}>
                  {getButtonText()}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
      {renderOrderSummary()}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CheckoutForm />
    </Suspense>
  )
}
