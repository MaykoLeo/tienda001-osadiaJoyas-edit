'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, OrderItem, PaymentType } from '@/lib/types'; // Import OrderItem
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, FileDown, ChevronRight, User, Mail, Phone, Home as HomeIcon, Wallet, Ticket, ChevronsUpDown, ArrowUp, ArrowDown, ListFilter, Search, Store, HandCoins, Truck } from 'lucide-react';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 15;

const orderStatuses: OrderStatus[] = ['pending_payment', 'awaiting_payment_in_store', 'paid', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'];

const statusLabels: Record<OrderStatus, string> = {
    pending_payment: 'Pago Pendiente',
    awaiting_payment_in_store: 'Esperando Pago en Local',
    paid: 'Abonado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    failed: 'Fallido',
    refunded: 'Reintegrado',
    pending: 'Pendiente'
};

export const getOrderType = (order: Order) => {
    if (order.paymentId) return 'Pedido Online';
    if (order.paymentType === 'Pago en Local' as any) return 'Pedido Online';
    if (order.deliveryMethod === 'shipping' || order.deliveryMethod === 'pay_in_store') return 'Pedido Online';
    if (order.deliveryMethod === 'pickup' && order.pickupDni && order.pickupDni.length > 0) return 'Pedido Online';
    if (order.status === 'pending_payment' || order.status === 'awaiting_payment_in_store') return 'Pedido Online';
    return 'Compra Local';
};

const OrderRow = React.memo(({ order, onStatusChange }: { order: Order; onStatusChange: (orderId: number, newStatus: OrderStatus) => void; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

    // Memoizar cálculos pesados - solo recalcular si cambia el ID de la orden
    const orderMetrics = useMemo(() => {
        const subtotal = order.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
        const preCouponSubtotal = subtotal + (order.discountAmount || 0);
        const shippingCost = (() => {
            if (order.deliveryMethod === 'pickup' || order.deliveryMethod === 'pay_in_store') {
                return 0;
            }
            const cost = order.total - subtotal;
            return Math.max(0, cost);
        })();
        return { subtotal, preCouponSubtotal, shippingCost };
    }, [order.id, order.items, order.total, order.discountAmount, order.deliveryMethod]);

    // Determinar tipo de pedido
    const orderType = useMemo(() => getOrderType(order), [order.paymentId, order.paymentType, order.deliveryMethod, order.pickupDni, order.status]);

    // Filtrar estados disponibles según el tipo de pedido
    const availableStatuses = useMemo(() => {
        if (orderType === 'Compra Local') {
            // Solo 3 estados para órdenes POS
            return ['delivered', 'cancelled', 'refunded'] as OrderStatus[];
        }
        // Todos los estados para órdenes online
        return orderStatuses;
    }, [orderType]);



    const getStatusClasses = (status: Order['status']) => {
        switch (status) {
            case 'delivered': return "bg-green-100 text-green-800 border-green-200";
            case 'pending_payment':
            case 'awaiting_payment_in_store': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'failed':
            case 'cancelled': return "bg-red-100 text-red-800 border-red-200";
            case 'paid': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'shipped': return "bg-purple-100 text-purple-800 border-purple-200";
            case 'refunded': return "bg-orange-100 text-orange-800 border-orange-200";
            default: return "bg-background border-input";
        }
    }

    const handleStatusSelect = (newStatus: OrderStatus) => { if (newStatus !== order.status) setPendingStatus(newStatus); };
    const confirmStatusChange = () => { if (pendingStatus) { onStatusChange(order.id, pendingStatus); setPendingStatus(null); } };
    const cancelStatusChange = () => setPendingStatus(null);

    const deliveryMethodLabels: Record<Order['deliveryMethod'], { label: string, icon: React.FC<any> }> = {
        shipping: { label: 'Envío a domicilio', icon: Truck },
        pickup: { label: 'Retiro en local', icon: Store },
        pay_in_store: { label: 'Pago en local', icon: HandCoins },
    };
    const DeliveryMethodDisplay = deliveryMethodLabels[order.deliveryMethod];

    return (
        <React.Fragment>
            <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && cancelStatusChange()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Cambio de Estado</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres cambiar el estado a <span className="font-semibold">"{pendingStatus ? statusLabels[pendingStatus] : ''}"</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelStatusChange}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TableRow className="hover:bg-muted/50 data-[state=open]:bg-muted/50" data-state={isOpen ? 'open' : 'closed'}>
                <TableCell className="font-mono text-sm cursor-pointer" onClick={() => setIsOpen(!isOpen)}>#{order.id}</TableCell>
                <TableCell className="font-medium cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{order.customerFirstName} {order.customerLastName}</TableCell>
                <TableCell className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                <TableCell className="font-semibold cursor-pointer text-center" onClick={() => setIsOpen(!isOpen)}>${order.total.toLocaleString('es-AR')}</TableCell>
                <TableCell className="cursor-pointer text-center" onClick={() => setIsOpen(!isOpen)}>
                    <span className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium",
                        orderType === 'Pedido Online'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                    )}>
                        {orderType}
                    </span>
                </TableCell>
                <TableCell className="cursor-pointer text-center" onClick={() => setIsOpen(!isOpen)}>{order.paymentType}</TableCell>
                <TableCell>
                    <Select value={order.status} onValueChange={handleStatusSelect}>
                        <SelectTrigger className={cn("h-8 text-xs font-semibold", getStatusClasses(order.status))}><SelectValue /></SelectTrigger>
                        <SelectContent>{availableStatuses.map(status => <SelectItem key={status} value={status} className="text-xs">{statusLabels[status]}</SelectItem>)}</SelectContent>
                    </Select>
                </TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="transition-transform data-[state=open]:rotate-90"><ChevronRight className="h-4 w-4" /></Button></TableCell>
            </TableRow>
            {isOpen && (
                <TableRow>
                    <TableCell colSpan={8} className="p-0">
                        <div className="bg-muted/50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg">Productos Comprados</h4>
                                    {order.items.map((item: OrderItem) => (
                                        <div key={item.productId} className="flex items-center gap-4">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                width={50}
                                                height={50}
                                                className="rounded-md border object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{item.name}</p>
                                                <div className="text-sm text-muted-foreground flex items-baseline gap-2">
                                                    <span>Cant: {item.quantity} | P. Unit.:</span>
                                                    <span className="font-semibold text-primary">${item.priceAtPurchase.toLocaleString('es-AR')}</span>
                                                    {item.originalPrice && item.originalPrice > item.priceAtPurchase && (
                                                        <span className="line-through text-xs">${item.originalPrice.toLocaleString('es-AR')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="font-semibold whitespace-nowrap">${(item.priceAtPurchase * item.quantity).toLocaleString('es-AR')}</p>
                                        </div>
                                    ))}
                                    <div className="pt-4 mt-4 border-t">
                                        <h4 className="font-semibold text-lg mb-2">Resumen de Costos</h4>
                                        <div className="space-y-1 text-sm max-w-md">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    {order.discountAmount && order.discountAmount > 0 ? 'Subtotal Original:' : 'Subtotal Productos:'}
                                                </span>
                                                <span className="font-medium">${orderMetrics.preCouponSubtotal.toLocaleString('es-AR')}</span>
                                            </div>

                                            {order.discountAmount && order.discountAmount > 0 && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Descuento (Cupón):</span>
                                                        <span className="font-medium text-destructive">- ${order.discountAmount.toLocaleString('es-AR')}</span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold">
                                                        <span className="text-muted-foreground">Subtotal c/ Descuento:</span>
                                                        <span>${orderMetrics.subtotal.toLocaleString('es-AR')}</span>
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Costo de Envío:</span>
                                                <span className="font-medium">${orderMetrics.shippingCost.toLocaleString('es-AR')}</span>
                                            </div>

                                            <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                                                <span>Total General:</span>
                                                <span>${order.total.toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg">Información del Cliente</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>{order.customerFirstName} {order.customerLastName}</span></div>
                                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${order.customerEmail}`} className="text-primary hover:underline">{order.customerEmail}</a></div>
                                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{order.customerPhone || 'No disponible'}</span></div>
                                    </div>

                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                        {DeliveryMethodDisplay && <DeliveryMethodDisplay.icon className="h-5 w-5" />} Detalle de Entrega
                                    </h4>
                                    <p className='text-sm font-bold text-primary'>{DeliveryMethodDisplay.label}</p>

                                    {(order.deliveryMethod === 'pickup' || order.deliveryMethod === 'pay_in_store') && (
                                        <div className="space-y-2 text-sm border-l-2 pl-3">
                                            <p className='font-medium'>Retira:</p>
                                            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{order.pickupName}</span></div>
                                            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /><span>DNI: {order.pickupDni}</span></div>
                                        </div>
                                    )}
                                    {order.deliveryMethod === 'shipping' && (
                                        <div className="space-y-2 text-sm border-l-2 pl-3">
                                            <p className='font-medium'>Dirección:</p>
                                            <div className="flex items-start gap-2"><HomeIcon className="h-4 w-4 text-muted-foreground mt-1" /><span>{order.shippingAddress}, {order.shippingLocality}, {order.shippingPostalCode}{order.shippingProvince ? `, ${order.shippingProvince}` : ''}</span></div>
                                        </div>
                                    )}

                                    <h4 className="font-semibold text-lg">Pago</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /><span>ID de Pago: <span className="font-mono">{order.paymentId || 'N/A'}</span></span></div>
                                        {order.couponCode && <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-muted-foreground" /><span>Cupón: <span className="font-semibold">{order.couponCode}</span> (-${order.discountAmount?.toLocaleString('es-AR')})</span></div>}
                                    </div>

                                    {order.notes && (
                                        <>
                                            <h4 className="font-semibold text-lg mt-4">Notas de la Orden</h4>
                                            <div className="p-3 bg-muted/40 rounded-md border text-sm italic text-muted-foreground">
                                                "{order.notes}"
                                            </div>
                                        </>
                                    )}


                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    )
}, (prevProps, nextProps) => {
    // Solo re-renderizar si la orden o su estado cambiaron
    return prevProps.order.id === nextProps.order.id &&
        prevProps.order.status === nextProps.order.status &&
        prevProps.order.total === nextProps.order.total;
});

type SortableKeys = 'id' | 'customerName' | 'createdAt' | 'total' | 'orderType';

export function OrdersTab({ orders, isLoading, onExport, onStatusChange }: { orders: Order[], isLoading: boolean, onExport: () => void, onStatusChange: (orderId: number, newStatus: OrderStatus) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' } | null>(null);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState<PaymentType | 'all'>('all');
    const [inputValue, setInputValue] = useState('');
    const [query, setQuery] = useState('');

    // Debounce de la búsqueda para mejorar rendimiento
    const debouncedQuery = useDebounce(query, 300);

    const searchedOrders = useMemo(() => {
        const lowercasedQuery = debouncedQuery.toLowerCase();
        if (!lowercasedQuery) return orders;

        return orders.filter(order => {
            const fieldsToSearch = [
                order.id.toString(), `${order.customerFirstName} ${order.customerLastName}`, order.customerEmail, order.customerPhone || '',
                order.total.toString(), format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: es }),
                order.deliveryMethod, order.shippingAddress || '', order.shippingLocality || '',
                order.shippingPostalCode || '', order.paymentId || '', order.couponCode || '',
                order.pickupName || '', order.pickupDni || '',
                order.paymentType || '',
                ...order.items.map((item: OrderItem) => item.name)
            ];
            return fieldsToSearch.some(field => field.toLowerCase().includes(lowercasedQuery));
        });
    }, [orders, debouncedQuery]);

    const statusFilteredOrders = useMemo(() => {
        if (statusFilter === 'all') return searchedOrders;
        return searchedOrders.filter(order => order.status === statusFilter);
    }, [searchedOrders, statusFilter]);

    const paymentTypeFilteredOrders = useMemo(() => {
        if (paymentTypeFilter === 'all') return statusFilteredOrders;
        return statusFilteredOrders.filter(order => order.paymentType === paymentTypeFilter);
    }, [statusFilteredOrders, paymentTypeFilter]);

    const sortedOrders = useMemo(() => {
        let sortableItems = [...paymentTypeFilteredOrders];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;

                // Manejo especial para orderType (calculado basándose en helper getOrderType)
                if (key === 'orderType') {
                    const typeA = getOrderType(a);
                    const typeB = getOrderType(b);
                    if (typeA < typeB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (typeA > typeB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                }

                const valA = a[key], valB = b[key];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [paymentTypeFilteredOrders, sortConfig]);

    const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = sortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const handlePageChange = (page: number) => { if (page > 0 && page <= totalPages) setCurrentPage(page); };
    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };
    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };
    const renderHeaderButton = (key: SortableKeys, label: string, className: string = "") => <Button variant="ghost" onClick={() => requestSort(key)} className={cn("px-2", className)}>{label}{getSortIcon(key)}</Button>;
    const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setQuery(inputValue.trim()); setCurrentPage(1); };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Historial de Órdenes</CardTitle>
                        <CardDescription>Visualiza y gestiona todas las órdenes de tus clientes.</CardDescription>
                    </div>
                    <Button onClick={onExport} variant="outline" disabled={isLoading}><FileDown className="mr-2 h-4 w-4" />Exportar a CSV</Button>
                </div>
                <div className="pt-4 mt-4 border-t flex flex-col md:flex-row items-center gap-4 justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente, producto, email, etc..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="pl-10 w-[300px]"
                                autoComplete="new-password"
                                name="search-orders-admin"
                                data-form-type="other"
                            />
                        </div>
                        <Button type="submit">Buscar</Button>
                    </form>
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
                </div>
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{renderHeaderButton('id', 'ID')}</TableHead>
                                        <TableHead>{renderHeaderButton('customerName', 'Cliente')}</TableHead>
                                        <TableHead>{renderHeaderButton('createdAt', 'Fecha')}</TableHead>
                                        <TableHead className="text-center">{renderHeaderButton('total', 'Total', 'w-full flex justify-center items-center')}</TableHead>
                                        <TableHead className="text-center">{renderHeaderButton('orderType', 'Tipo de Pedido', 'w-full flex justify-center items-center')}</TableHead>
                                        <TableHead className="w-[180px]">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="px-2 w-full justify-start">Tipo de pago<ListFilter className="ml-auto h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuRadioGroup value={paymentTypeFilter} onValueChange={(value) => { setPaymentTypeFilter(value as PaymentType | 'all'); setCurrentPage(1); }}>
                                                        <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="Efectivo">Efectivo</DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="Transferencia">Transferencia</DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="QR / Tarjeta">QR / Tarjeta</DropdownMenuRadioItem>
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableHead>
                                        <TableHead className="w-[230px]">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="px-2 w-full justify-start">Estado<ListFilter className="ml-auto h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => { setStatusFilter(value as OrderStatus | 'all'); setCurrentPage(1); }}>
                                                        <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                                                        {orderStatuses.map(status => <DropdownMenuRadioItem key={status} value={status}>{statusLabels[status]}</DropdownMenuRadioItem>)}
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>{paginatedOrders.map(order => <OrderRow key={order.id} order={order} onStatusChange={onStatusChange} />)}</TableBody>
                            </Table>
                        </div>
                        {totalPages > 1 && <div className="px-4 border-t"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></div>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
