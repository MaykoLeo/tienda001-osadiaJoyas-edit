'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Trash, Minus, ShoppingCart, User, ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Product, Category, OrderItem, PaymentType } from '@/lib/types';
import { createManualOrderAction } from '@/app/actions/order-actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface POSOrderFormProps {
    products: Product[];
    categories: Category[];
    onCancel: () => void;
    onSuccess: () => void;
}

export function POSOrderForm({ products, categories, onCancel, onSuccess }: POSOrderFormProps) {
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [customerFirstName, setCustomerFirstName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailError, setEmailError] = useState('');

    // New states for POS features
    const [browsingMode, setBrowsingMode] = useState<'search' | 'categories' | 'products'>('search');
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [discountPercentage, setDiscountPercentage] = useState<string>('0'); // String to handle empty input easier

    const [paymentMethod, setPaymentMethod] = useState<PaymentType>('Efectivo');
    const [notes, setNotes] = useState('');

    const { toast } = useToast();

    // Group categories
    const parentCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const childCategories = useMemo(() =>
        selectedParentId
            ? categories.filter(c => c.parentId === selectedParentId)
            : []
        , [categories, selectedParentId]);

    // Product Filtering Logic
    const filteredProducts = useMemo(() => {
        if (browsingMode === 'search') {
            if (!query) return [];
            const lowerQuery = query.toLowerCase();
            return products.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.id.toString().includes(lowerQuery) ||
                (p.sku && p.sku.toLowerCase().includes(lowerQuery))
            ).slice(0, 5);
        } else if (browsingMode === 'products' && selectedCategoryId) {
            return products.filter(p => p.categoryIds.includes(selectedCategoryId));
        }
        return [];
    }, [products, query, browsingMode, selectedCategoryId]);

    const addToCart = (product: Product) => {
        // Validation: Check for stock
        if (product.stock <= 0) {
            toast({ title: 'Sin Stock', description: `No hay stock disponible para ${product.name}.`, variant: 'destructive' });
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast({ title: 'Stock Insuficiente', description: `Solo hay ${product.stock} unidades de ${product.name}.`, variant: 'destructive' });
                    return prev;
                }
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                image: product.images[0] || '',
                quantity: 1,
                priceAtPurchase: product.salePrice ?? product.price,
                originalPrice: product.price
            }];
        });
        if (browsingMode === 'search') setQuery('');
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                // Check stock for increment
                if (delta > 0) {
                    const product = products.find(p => p.id === productId);
                    if (product && item.quantity >= product.stock) {
                        toast({ title: 'Stock Insuficiente', description: `No puedes agregar más unidades.`, variant: 'destructive' });
                        return item;
                    }
                }
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    // Calculate Totals
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0), [cart]);
    const discountValue = parseFloat(discountPercentage) || 0;
    const discountAmount = useMemo(() => subtotal * (discountValue / 100), [subtotal, discountValue]);
    const total = subtotal - discountAmount;

    const handleDiscountChange = (val: string) => {
        // Allow numbers only, max 100
        if (val === '') {
            setDiscountPercentage('');
            return;
        }
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0 && num <= 100 && !val.includes('e')) {
            setDiscountPercentage(val);
        }
    };

    const validateEmail = (email: string) => {
        if (!email) {
            setEmailError('');
            return true;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Email inválido (debe contener @ y dominio)');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleEmailChange = (value: string) => {
        setCustomerEmail(value);
        validateEmail(value);
    };

    const handlePhoneChange = (value: string) => {
        // Solo permitir números, espacios, +, -, ( y )
        const cleanValue = value.replace(/[^0-9+\-\s()]/g, '');
        setCustomerPhone(cleanValue);
    };


    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast({ title: 'Error', description: 'El carrito está vacío.', variant: 'destructive' });
            return;
        }

        // Validar email si está presente
        if (customerEmail && !validateEmail(customerEmail)) {
            toast({ title: 'Error', description: 'Por favor ingresa un email válido o déjalo vacío.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('items', JSON.stringify(cart));
        formData.append('customerFirstName', customerFirstName);
        formData.append('customerLastName', customerLastName);
        formData.append('customerEmail', customerEmail);
        formData.append('customerPhone', customerPhone);

        // Pass discount amount (calculated)
        if (discountAmount > 0) {
            formData.append('discountAmount', discountAmount.toFixed(2));
        }

        formData.append('paymentMethod', paymentMethod);
        formData.append('notes', notes);

        const result = await createManualOrderAction(formData);

        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: 'Orden creada correctamente.' });
            onSuccess();
        }
        setIsSubmitting(false);
    };

    // Browsing Controls
    const resetBrowsing = () => {
        setBrowsingMode('search');
        setSelectedParentId(null);
        setSelectedCategoryId(null);
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 md:h-full md:overflow-hidden">
            {/* Left Column: Product Search + Customer Data (shown below summary on mobile) */}
            <div className="flex-1 flex flex-col gap-4 md:overflow-y-auto md:pr-2 order-2 md:order-1">
                <Card className='flex flex-col min-h-fit max-h-[450px]'>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2"><Search className="h-5 w-5" /> Buscar Productos</span>
                            {browsingMode !== 'search' && (
                                <Button variant="ghost" size="sm" onClick={resetBrowsing}>Volver al Buscador</Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1 overflow-y-auto min-h-[150px]">
                        {browsingMode === 'search' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Buscar por nombre, SKU o ID..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoComplete="new-password"
                                        name="search-products-pos"
                                        data-form-type="other"
                                    />
                                    {query && (
                                        <div className="border rounded-md shadow-sm mt-1 max-h-60 overflow-y-auto bg-background">
                                            {filteredProducts.length === 0 ? (
                                                <div className="p-3 text-sm text-muted-foreground text-center">No se encontraron productos.</div>
                                            ) : (
                                                filteredProducts.map(product => (
                                                    <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer" onClick={() => addToCart(product)}>
                                                        <div className="h-10 w-10 relative bg-muted rounded overflow-hidden flex-shrink-0">
                                                            {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{product.name}</p>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="text-muted-foreground">ID: {product.id}</span>
                                                                <span className={product.stock > 0 ? "text-green-600" : "text-destructive"}>Stock: {product.stock}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            {product.salePrice && product.salePrice < product.price ? (
                                                                <>
                                                                    <div className="text-xs text-muted-foreground line-through">${product.price.toLocaleString('es-AR')}</div>
                                                                    <div className="font-bold text-sm text-green-600">${product.salePrice.toLocaleString('es-AR')}</div>
                                                                </>
                                                            ) : (
                                                                <div className="font-bold text-sm">${product.price.toLocaleString('es-AR')}</div>
                                                            )}
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"><Plus className="h-4 w-4" /></Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest bg-background px-2 relative z-10">O también</span>
                                    <div className="border-t -mt-2.5 mb-4"></div>
                                    <Button variant="outline" className="w-full" onClick={() => setBrowsingMode('categories')}>Elegir Manualmente desde Categorías</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {browsingMode === 'categories' && !selectedParentId && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Selecciona Categoría Principal:</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {parentCategories.map(cat => (
                                                <Button key={cat.id} variant="outline" className="h-auto py-3 justify-start" onClick={() => setSelectedParentId(cat.id)}>
                                                    {cat.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {browsingMode === 'categories' && selectedParentId && (
                                    <div className="space-y-2">
                                        <button onClick={() => setSelectedParentId(null)} className="text-sm text-primary hover:underline mb-2 flex items-center"><ChevronLeft className="h-3 w-3 mr-1" /> Volver</button>
                                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Selecciona Sub-Categoría:</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {childCategories.map(cat => (
                                                <Button key={cat.id} variant="outline" className="h-auto py-3 justify-start" onClick={() => { setSelectedCategoryId(cat.id); setBrowsingMode('products'); }}>
                                                    {cat.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {browsingMode === 'products' && (
                                    <div className="space-y-2 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <button onClick={() => { setBrowsingMode('categories'); setSelectedCategoryId(null); }} className="text-sm text-primary hover:underline flex items-center"><ChevronLeft className="h-3 w-3 mr-1" /> Volver a categorías</button>
                                        </div>
                                        {/* Overflow-x-auto to allow scrolling on small screens */}
                                        <div className="border rounded-md flex-1 overflow-auto relative">
                                            <div className="min-w-[320px]">
                                                <ScrollArea className="h-[300px] lg:h-full">
                                                    <div className='p-2 space-y-1'>
                                                        {filteredProducts.length === 0 ? (
                                                            <div className="p-4 text-center text-muted-foreground">No hay productos en esta categoría.</div>
                                                        ) : (
                                                            filteredProducts.map(product => (
                                                                <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-muted border rounded-sm cursor-pointer" onClick={() => addToCart(product)}>
                                                                    <div className="h-10 w-10 relative bg-muted rounded overflow-hidden flex-shrink-0">
                                                                        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium truncate text-sm">{product.name}</p>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className={product.stock > 0 ? "text-green-600" : "text-destructive"}>Stock: {product.stock}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                        {product.salePrice && product.salePrice < product.price ? (
                                                                            <>
                                                                                <div className="text-xs text-muted-foreground line-through">${product.price.toLocaleString('es-AR')}</div>
                                                                                <div className="font-bold text-sm text-green-600">${product.salePrice.toLocaleString('es-AR')}</div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="font-bold text-sm">${product.price.toLocaleString('es-AR')}</div>
                                                                        )}
                                                                    </div>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"><Plus className="h-4 w-4" /></Button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden flex flex-col shrink-0">
                    <CardHeader className="py-3 border-b bg-muted/20">
                        <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Datos del Cliente (Opcional)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="cFirstName">Nombre(s)</Label>
                                <Input
                                    id="cFirstName"
                                    placeholder="Ejemplo: Juan"
                                    value={customerFirstName}
                                    onChange={e => setCustomerFirstName(e.target.value.slice(0, 60))}
                                    maxLength={60}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="cLastName">Apellido</Label>
                                <Input
                                    id="cLastName"
                                    placeholder="Ejemplo: Pérez"
                                    value={customerLastName}
                                    onChange={e => setCustomerLastName(e.target.value.slice(0, 60))}
                                    maxLength={60}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="cPhone">Teléfono</Label>
                                <Input
                                    id="cPhone"
                                    placeholder="Ejemplo: +54 11 1234 5678"
                                    value={customerPhone}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                    maxLength={20}
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label htmlFor="cEmail">Email</Label>
                                <Input
                                    id="cEmail"
                                    type="email"
                                    placeholder="Ejemplo: juan@ejemplo.com"
                                    value={customerEmail}
                                    onChange={e => handleEmailChange(e.target.value)}
                                    className={emailError ? 'border-destructive' : ''}
                                />
                                {emailError && (
                                    <p className="text-xs text-destructive">{emailError}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column / Top on mobile: Cart Summary */}
            <Card className="flex-1 flex flex-col shadow-xl border-primary/20 bg-card md:overflow-hidden md:h-full md:max-h-full order-1 md:order-2">
                <CardHeader className="bg-primary text-primary-foreground py-3 shrink-0">
                    <CardTitle className="flex justify-between items-center text-lg">
                        <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Resumen de Orden</span>
                        <span>{cart.length} items</span>
                    </CardTitle>
                </CardHeader>

                {/* Single Scrollable Area for ALL content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="min-h-[120px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5 rounded-md">
                                <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                                <p>No hay productos seleccionados.</p>
                                <p className="text-sm">Busca y agrega productos para comenzar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.productId} className="flex items-start gap-3 p-3 bg-muted/30 rounded-md border">
                                        {/* Product thumbnail */}
                                        <div className="h-14 w-14 relative bg-muted rounded overflow-hidden flex-shrink-0 border">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingCart className="h-5 w-5 opacity-30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium line-clamp-2 mb-1 text-sm">{item.name}</div>
                                            <div className="text-xs text-muted-foreground mb-2">
                                                {item.originalPrice && item.originalPrice > item.priceAtPurchase ? (
                                                    <>
                                                        <span className="line-through mr-1">${item.originalPrice.toLocaleString('es-AR')}</span>
                                                        <span className="font-bold text-primary">${item.priceAtPurchase.toLocaleString('es-AR')}</span>
                                                    </>
                                                ) : (
                                                    <span>${item.priceAtPurchase.toLocaleString('es-AR')}</span>
                                                )}
                                                <span className="ml-1">x ud.</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.productId, -1)} disabled={item.quantity <= 1}><Minus className="h-3 w-3" /></Button>
                                                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                                                </div>
                                                <div className="font-bold text-sm">
                                                    ${(item.priceAtPurchase * item.quantity).toLocaleString('es-AR')}
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeFromCart(item.productId)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Order Details & Totals Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-3">
                                {cart.length > 0 && (
                                    <div className="flex items-center justify-between gap-4">
                                        <Label htmlFor="discount" className="whitespace-nowrap font-medium">Descuento (%)</Label>
                                        <div className="relative w-24">
                                            <Input
                                                id="discount"
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="text-right pr-6"
                                                placeholder="Ejemplo: 0"
                                                value={discountPercentage}
                                                onChange={(e) => handleDiscountChange(e.target.value)}
                                                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2 border-t">
                                    <div className="space-y-1">
                                        <Label htmlFor="paymentMethod">Método de Pago</Label>
                                        <Select value={paymentMethod} onValueChange={(val: PaymentType) => setPaymentMethod(val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar método" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                                <SelectItem value="Transferencia">Transferencia</SelectItem>
                                                <SelectItem value="QR / Tarjeta">QR / Tarjeta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="notes">Notas de la Orden</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Instrucciones especiales, observaciones..."
                                            className="resize-none h-20"
                                            maxLength={100}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                        <div className="text-xs text-right text-muted-foreground">
                                            {notes.length}/100
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2 border-t">
                                    {parseFloat(discountPercentage) > 0 && (
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Subtotal:</span>
                                            <span>${subtotal.toLocaleString('es-AR')}</span>
                                        </div>
                                    )}
                                    {parseFloat(discountPercentage) > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Descuento ({discountPercentage}%):</span>
                                            <span>- ${discountAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-2xl font-bold">
                                        <span>Total:</span>
                                        <span>${total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Fixed bottom controls for mobile convenience */}
                <div className="grid grid-cols-2 gap-3 p-4 border-t bg-background shrink-0">
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || cart.length === 0}>
                        {isSubmitting ? 'Procesando...' : 'Confirmar Orden'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
