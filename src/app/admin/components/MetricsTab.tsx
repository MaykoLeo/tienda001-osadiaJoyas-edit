"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Wallet, DollarSign, ShoppingCart, TrendingUp, AlertTriangle, BarChart, CreditCard, Clock, Crown, PackageX, Search, ChevronLeft, Plus, Calendar as CalendarIcon } from 'lucide-react';
import type { Product, SalesMetrics, Category } from '@/lib/types';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart as RechartsAreaChart, Area } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useEffect } from 'react';
import { getProductMetricsAction } from '@/app/admin/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type PeriodKey = '7d' | '30d' | '90d' | 'year' | 'all' | 'custom';

interface PeriodOption {
    key: PeriodKey;
    label: string;
    description: string;
    getDates: () => { startDate?: Date; endDate?: Date };
}

const PERIOD_OPTIONS: PeriodOption[] = [
    {
        key: '7d',
        label: 'Últimos 7 días',
        description: 'en los últimos 7 días',
        getDates: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            return { startDate: start, endDate: end };
        },
    },
    {
        key: '30d',
        label: 'Últimos 30 días',
        description: 'en los últimos 30 días',
        getDates: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            return { startDate: start, endDate: end };
        },
    },
    {
        key: '90d',
        label: 'Últimos 90 días',
        description: 'en los últimos 90 días',
        getDates: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 90);
            start.setHours(0, 0, 0, 0);
            return { startDate: start, endDate: end };
        },
    },
    {
        key: 'year',
        label: 'Este año',
        description: `en ${new Date().getFullYear()}`,
        getDates: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            return { startDate: start, endDate: now };
        },
    },
    {
        key: 'all',
        label: 'Todo el tiempo',
        description: 'acumulado total',
        getDates: () => ({ startDate: undefined, endDate: undefined }),
    },
];

export function MetricsTab({
    products,
    salesMetrics,
    earliestOrderDate,
    isLoading,
    isMetricsLoading,
    categories,
    onPeriodChange,
}: {
    products: Product[];
    salesMetrics: SalesMetrics | null;
    earliestOrderDate?: Date | null;
    isLoading: boolean;
    isMetricsLoading: boolean;
    categories: Category[];
    onPeriodChange: (startDate?: Date, endDate?: Date) => void;
}) {
    const [activePeriod, setActivePeriod] = useState<PeriodKey>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [chartType, setChartType] = useState<'revenue' | 'orders'>('revenue');

    // --- ESTADOS: BUSCADOR DE PRODUCTOS ---
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productMetrics, setProductMetrics] = useState<any[]>([]);
    const [isProductMetricsLoading, setIsProductMetricsLoading] = useState(false);
    
    // UI Local States for Advanced Search
    const [searchQuery, setSearchQuery] = useState('');
    const [browsingMode, setBrowsingMode] = useState<'search' | 'categories' | 'products'>('search');
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [lowStockThreshold, setLowStockThreshold] = useState<number>(3);

    // Gem & Stagnant Ranking States
    const [gemSortKey, setGemSortKey] = useState<'revenue' | 'sold'>('revenue');
    const [gemSortOrder, setGemSortOrder] = useState<'asc' | 'desc'>('desc');

    // Filter Logic
    const parentCategoriesList = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const childCategoriesList = useMemo(() =>
        selectedParentId
            ? categories.filter(c => c.parentId === selectedParentId)
            : []
    , [categories, selectedParentId]);

    const filteredSearchProducts = useMemo(() => {
        if (browsingMode === 'search') {
            if (!searchQuery) return [];
            const lowerQuery = searchQuery.toLowerCase();
            return products.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.id.toString().includes(lowerQuery) ||
                (p.sku && p.sku.toLowerCase().includes(lowerQuery))
            ).slice(0, 10);
        } else if (browsingMode === 'products' && selectedCategoryId) {
            return products.filter(p => p.categoryIds.includes(selectedCategoryId));
        }
        return [];
    }, [products, searchQuery, browsingMode, selectedCategoryId]);

    const resetAdvancedSearch = () => {
        setBrowsingMode('search');
        setSelectedParentId(null);
        setSelectedCategoryId(null);
        setSearchQuery('');
    };

    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const inventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockProducts = products.filter(p => p.stock >= 0 && p.stock <= lowStockThreshold).sort((a,b) => a.stock - b.stock);

    const stagnantProducts = useMemo(() => {
        if (!salesMetrics || !products) return [];
        
        const soldProductIds = new Set(salesMetrics.topSellingProducts.map(sp => sp.productId));
        const topRevenueIds = salesMetrics.topRevenueProducts ? new Set(salesMetrics.topRevenueProducts.map(rp => rp.productId)) : new Set();
        
        return products
            .filter(p => p.stock > 0 && !soldProductIds.has(p.id) && !topRevenueIds.has(p.id))
            .sort((a, b) => b.stock - a.stock); // No slice here, letting ScrollArea handle it
    }, [products, salesMetrics]);

    const gemRankings = useMemo(() => {
        if (!salesMetrics) return [];
        
        // Unir datos de ventas por cantidad e ingresos
        const revenueMap = new Map(salesMetrics.topRevenueProducts?.map(p => [p.productId, p.revenue]) || []);
        const soldMap = new Map(salesMetrics.topSellingProducts?.map(p => [p.productId, p.count]) || []);
        
        const allSoldIds = new Set([...revenueMap.keys(), ...soldMap.keys()]);
        
        const data = Array.from(allSoldIds).map(id => {
            const product = products.find(p => p.id === id);
            return {
                id,
                name: product?.name || 'Producto Desconocido',
                revenue: revenueMap.get(id) || 0,
                sold: soldMap.get(id) || 0
            };
        });

        return data.sort((a, b) => {
            const multiplier = gemSortOrder === 'desc' ? 1 : -1;
            if (gemSortKey === 'revenue') return (b.revenue - a.revenue) * multiplier;
            return (b.sold - a.sold) * multiplier;
        });
    }, [salesMetrics, products, gemSortKey, gemSortOrder]);

    const toggleGemSort = (key: 'revenue' | 'sold') => {
        if (gemSortKey === key) {
            setGemSortOrder(gemSortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setGemSortKey(key);
            setGemSortOrder('desc');
        }
    };

    const activePeriodOption = activePeriod === 'custom' 
        ? { description: dateRange?.from ? (dateRange.to ? `entre ${format(dateRange.from, 'dd/MM/yyyy')} y ${format(dateRange.to, 'dd/MM/yyyy')}` : `desde el ${format(dateRange.from, 'dd/MM/yyyy')}`) : 'período personalizado' }
        : PERIOD_OPTIONS.find(p => p.key === activePeriod)!;

    const handlePeriodChange = useCallback((periodKey: PeriodKey) => {
        setActivePeriod(periodKey);
        if (periodKey === 'custom') {
            onPeriodChange(dateRange?.from, dateRange?.to);
        } else {
            const option = PERIOD_OPTIONS.find(p => p.key === periodKey)!;
            const { startDate, endDate } = option.getDates();
            onPeriodChange(startDate, endDate);
        }
    }, [onPeriodChange, dateRange]);

    // --- EFECTO: OBTENER DATOS DEL PRODUCTO SELECCIONADO ---
    useEffect(() => {
        if (!selectedProductId) {
            setProductMetrics([]);
            return;
        }

        async function fetchMetrics() {
            setIsProductMetricsLoading(true);
            let startDate, endDate;
            if (activePeriod === 'custom') {
                startDate = dateRange?.from;
                endDate = dateRange?.to;
            } else {
                const option = PERIOD_OPTIONS.find(p => p.key === activePeriod)!;
                const dates = option.getDates();
                startDate = dates.startDate;
                endDate = dates.endDate;
            }
            
            const result = await getProductMetricsAction(Number(selectedProductId), startDate, endDate);
            if (result.success && result.data) {
                setProductMetrics(result.data);
            } else {
                setProductMetrics([]);
            }
            setIsProductMetricsLoading(false);
        }

        fetchMetrics();
    }, [selectedProductId, activePeriod]);

    const categoryData = useMemo(() => {
        const parentCategories = categories.filter(c => !c.parentId);
        const data = parentCategories.map(parentCat => {
            const childCategoryIds = categories.filter(c => c.parentId === parentCat.id).map(c => c.id);
            const allCategoryIds = [parentCat.id, ...childCategoryIds];
            const productCount = products.filter(p => p.categoryIds.some(catId => allCategoryIds.includes(catId))).length;
            return { category: parentCat.name, products: productCount };
        }).filter(d => d.products > 0);
        return data;
    }, [categories, products]);

    const processedRevenueData = useMemo(() => {
        if (!salesMetrics?.revenueByDate) return [];
        
        if (activePeriod === 'year' || activePeriod === 'all') {
            const grouped = new Map<string, { revenue: number, estimatedRevenue: number, orders: number, allOrders: number }>();
            salesMetrics.revenueByDate.forEach(item => {
                const date = parseISO(item.date);
                const monthKey = format(date, 'yyyy-MM');
                const current = grouped.get(monthKey) || { revenue: 0, estimatedRevenue: 0, orders: 0, allOrders: 0 };
                current.revenue += item.revenue;
                current.estimatedRevenue += item.estimatedRevenue;
                current.orders += item.orders;
                current.allOrders += item.allOrders;
                grouped.set(monthKey, current);
            });
            
            return Array.from(grouped.entries()).map(([month, data]) => ({
                date: month + '-01',
                revenue: data.revenue,
                estimatedRevenue: data.estimatedRevenue,
                orders: data.orders,
                allOrders: data.allOrders,
                isMonth: true
            })).sort((a, b) => a.date.localeCompare(b.date));
        }
        
        return salesMetrics.revenueByDate;
    }, [salesMetrics, activePeriod]);

    // Data mapped with a stable key for smooth Recharts path animations
    const chartDisplayData = useMemo(() => {
        return processedRevenueData.map(item => ({
            ...item,
            value: chartType === 'revenue' ? item.revenue : item.allOrders
        }));
    }, [processedRevenueData, chartType]);

    const isMetricsSpinning = isLoading || isMetricsLoading;

    // Format dates on the X axis depending on the period length
    const formatXAxisDate = (dateStr: string) => {
        try {
            const d = parseISO(dateStr);
            if (activePeriod === 'year' || activePeriod === 'all') {
                return format(d, 'MMM yyyy', { locale: es });
            }
            return format(d, 'd MMM', { locale: es });
        } catch { return dateStr; }
    };

    const formatTooltipDate = (dateStr: string) => {
        try { 
            const d = parseISO(dateStr);
            if (activePeriod === 'year' || activePeriod === 'all') {
                return format(d, 'MMMM yyyy', { locale: es });
            }
            return format(d, 'EEEE d \u2018MMM\u2019 yyyy', { locale: es }); 
        }
        catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Período:</span>
                <div className="flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map((option) => (
                        <Button
                            key={option.key}
                            variant={activePeriod === option.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange(option.key)}
                            disabled={isMetricsSpinning}
                            className="text-xs"
                        >
                            {option.label}
                        </Button>
                    ))}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={activePeriod === 'custom' ? 'default' : 'outline'}
                                size="sm"
                                disabled={isMetricsSpinning}
                                className={cn("text-xs justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                                    ) : (
                                        format(dateRange.from, 'dd/MM')
                                    )
                                ) : (
                                    <span>Personalizado</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => {
                                    setDateRange(range);
                                    if (range?.from) {
                                        setActivePeriod('custom');
                                        onPeriodChange(range.from, range.to);
                                    }
                                }}
                                numberOfMonths={2}
                                disabled={(date) => 
                                    date > new Date() || 
                                    (earliestOrderDate ? date < earliestOrderDate : false)
                                }
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                {isMetricsLoading && !isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-1" />
                )}
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="products">Productos e Inventario</TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA: GENERAL --- */}
                <TabsContent value="general" className="space-y-6">
                    {/* General KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Ingresos — filtrado por período */}
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isMetricsSpinning || !salesMetrics
                                        ? <Loader2 className="h-6 w-6 animate-spin" />
                                        : `$${salesMetrics.totalRevenue.toLocaleString('es-AR')}`}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">{activePeriodOption.description}</p>
                            </CardContent>
                        </Card>

                        {/* Ventas — filtrado por período */}
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Órdenes Completadas</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isMetricsSpinning || !salesMetrics
                                        ? <Loader2 className="h-6 w-6 animate-spin" />
                                        : `${salesMetrics.totalSales}`}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">{activePeriodOption.description}</p>
                            </CardContent>
                        </Card>

                        {/* Ticket Promedio */}
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isMetricsSpinning || !salesMetrics
                                        ? <Loader2 className="h-6 w-6 animate-spin" />
                                        : `$${salesMetrics.totalSales > 0 ? (salesMetrics.totalRevenue / salesMetrics.totalSales).toLocaleString('es-AR', { maximumFractionDigits: 0 }) : '0'}`}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">{activePeriodOption.description}</p>
                            </CardContent>
                        </Card>

                        {/* Órdenes Pendientes */}
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isMetricsSpinning || !salesMetrics
                                        ? <Loader2 className="h-6 w-6 animate-spin" />
                                        : `${salesMetrics.pendingOrders}`}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">{activePeriodOption.description}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Revenue / Orders Over Time Chart */}
                        <Card className="shadow-md min-w-0 overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 space-y-2 sm:space-y-0">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {chartType === 'revenue' ? (
                                            <><DollarSign className="h-4 w-4 text-primary" /> Ingresos en el Tiempo</>
                                        ) : (
                                            <><ShoppingCart className="h-4 w-4 text-primary" /> Órdenes en el Tiempo</>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Evolución de {chartType === 'revenue' ? 'ingresos' : 'total de órdenes (todos los estados)'} — <span className="font-medium">{activePeriodOption.description}</span>
                                    </CardDescription>
                                </div>
                                
                                {/* Toggle Chart Type */}
                                <div className="flex bg-muted p-1 rounded-lg w-fit">
                                    <Button
                                        variant={chartType === 'revenue' ? 'default' : 'ghost'}
                                        size="sm"
                                        className="text-xs h-7 px-3"
                                        onClick={() => setChartType('revenue')}
                                    >
                                        Ingresos
                                    </Button>
                                    <Button
                                        variant={chartType === 'orders' ? 'default' : 'ghost'}
                                        size="sm"
                                        className="text-xs h-7 px-3"
                                        onClick={() => setChartType('orders')}
                                    >
                                        Órdenes
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isMetricsSpinning || !salesMetrics ? (
                                    <div className="flex justify-center items-center h-56">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : salesMetrics.revenueByDate.length > 0 ? (
                                    <div className="h-64 overflow-x-auto overflow-y-hidden pb-4 max-w-full">
                                        <ChartContainer
                                            config={{
                                                revenue: { label: 'Ingresos', color: 'hsl(var(--primary))' },
                                                orders: { label: 'Órdenes', color: 'hsl(var(--muted-foreground))' },
                                            }}
                                            className="h-full w-full min-w-full"
                                        >
                                            <div style={{ minWidth: activePeriod === 'all' && processedRevenueData.length > 10 ? `${processedRevenueData.length * 64}px` : '100%', height: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsAreaChart
                                                        data={chartDisplayData}
                                                        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                                                                <stop 
                                                                    offset="5%" 
                                                                    stopColor={chartType === 'revenue' ? 'hsl(var(--primary))' : 'hsl(var(--chart-2, 210 100% 50%))'} 
                                                                    stopOpacity={0.3} 
                                                                    style={{ transition: 'stop-color 0.5s ease-in-out' }}
                                                                />
                                                                <stop 
                                                                    offset="95%" 
                                                                    stopColor={chartType === 'revenue' ? 'hsl(var(--primary))' : 'hsl(var(--chart-2, 210 100% 50%))'} 
                                                                    stopOpacity={0} 
                                                                    style={{ transition: 'stop-color 0.5s ease-in-out' }}
                                                                />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickMargin={8}
                                                            tickFormatter={formatXAxisDate}
                                                            tick={{ fontSize: 11 }}
                                                            interval={activePeriod === 'all' || activePeriod === 'year' ? 0 : 'preserveStartEnd'}
                                                        />
                                                        <YAxis
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickMargin={8}
                                                            tick={{ fontSize: 11 }}
                                                            tickFormatter={(v) => chartType === 'revenue' 
                                                                ? `$${Number(v).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                                                                : Number(v).toString()
                                                            }
                                                            width={72}
                                                        />
                                                        <Tooltip
                                                            cursor={{ stroke: chartType === 'revenue' ? 'hsl(var(--primary))' : 'hsl(var(--chart-2, 210 100% 50%))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                            content={({ active, payload, label }) => {
                                                                if (!active || !payload?.length) return null;
                                                                const revenue = payload[0]?.payload?.revenue as number ?? 0;
                                                                const estimatedRevenue = payload[0]?.payload?.estimatedRevenue as number ?? 0;
                                                                const completedOrders = payload[0]?.payload?.orders as number ?? 0;
                                                                const allOrders = payload[0]?.payload?.allOrders as number ?? 0;
                                                                
                                                                return (
                                                                    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1 z-50 relative">
                                                                        <p className="font-semibold capitalize">{formatTooltipDate(label)}</p>
                                                                        {chartType === 'revenue' ? (
                                                                            <>
                                                                                <p className="text-primary font-bold">Ingresos: ${Number(revenue).toLocaleString('es-AR')}</p>
                                                                                <p className="text-muted-foreground">{completedOrders} {completedOrders === 1 ? 'orden completada' : 'órdenes completadas'}</p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="font-bold text-[hsl(var(--chart-2,210_100%_50%))]">{allOrders} {allOrders === 1 ? 'orden en total' : 'órdenes en total'}</p>
                                                                                <p className="text-muted-foreground">{completedOrders} {completedOrders === 1 ? 'orden completada' : 'órdenes completadas'}</p>
                                                                                <p className="text-muted-foreground mt-2">Ingresos Completados: ${Number(revenue).toLocaleString('es-AR')}</p>
                                                                                <p className="text-muted-foreground">Ingresos Estimados: ${Number(estimatedRevenue).toLocaleString('es-AR')}</p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={chartType === 'revenue' ? 'hsl(var(--primary))' : 'hsl(var(--chart-2, 210 100% 50%))'}
                                                            strokeWidth={2}
                                                            fill="url(#gradientColor)"
                                                            isAnimationActive={true}
                                                            animationDuration={500}
                                                            animationEasing="ease-in-out"
                                                            style={{
                                                                transition: 'stroke 0.5s ease-in-out, fill 0.5s ease-in-out'
                                                            }}
                                                            dot={{
                                                                r: 4,
                                                                fill: 'hsl(var(--background))',
                                                                stroke: chartType === 'revenue' ? 'hsl(var(--primary))' : 'hsl(var(--chart-2, 210 100% 50%))',
                                                                strokeWidth: 2,
                                                            }}
                                                            activeDot={{
                                                                r: 6,
                                                                strokeWidth: 0,
                                                                fill: chartType === 'revenue' ? 'hsl(var(--primary))' : 'hsl(var(--chart-2, 210 100% 50%))',
                                                            }}
                                                        />
                                                    </RechartsAreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </ChartContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-col justify-center items-center h-56 gap-2">
                                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground text-sm">Sin ingresos registrados en este período.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Productos Más Vendidos */}
                        <Card className="shadow-md min-w-0 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="text-blue-500" />
                                    Productos Más Vendidos
                                </CardTitle>
                                <CardDescription>
                                    Top 5 por unidades vendidas — <span className="font-medium">{activePeriodOption.description}</span>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    {isMetricsSpinning || !salesMetrics ? (
                                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                    ) : salesMetrics.topSellingProducts.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-right">Unidades</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesMetrics.topSellingProducts.slice(0, 5).sort((a,b) => b.count - a.count).map((p, idx) => (
                                                    <TableRow key={p.productId}>
                                                        <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                                                        <TableCell className="font-medium">{p.name}</TableCell>
                                                        <TableCell className="text-right font-bold text-primary">{p.count}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="flex flex-col justify-center items-center h-48 gap-2">
                                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground text-sm">Sin ventas en este período.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- PESTAÑA: PRODUCTOS E INVENTARIO --- */}
                <TabsContent value="products" className="space-y-6">
                    
                    {/* Buscador y Comparador Individual */}
                    <Card className="shadow-md border-primary/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart className="h-5 w-5 text-primary" />
                                Buscador y Rendimiento Individual
                            </CardTitle>
                            <CardDescription>Selecciona un producto para ver sus ventas detalladas en {activePeriodOption.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Selector */}
                                <div className="w-full md:w-1/3 space-y-4">
                                    <div className="space-y-4 border rounded-lg p-4 bg-background/50 shadow-inner">
                                        {browsingMode === 'search' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buscar Producto</label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Nombre, SKU o ID..."
                                                            className="pl-9 h-11"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {searchQuery && (
                                                    <ScrollArea className="h-48 border rounded-md bg-card">
                                                        <div className="p-2 space-y-1">
                                                            {filteredSearchProducts.length === 0 ? (
                                                                <p className="text-xs text-center text-muted-foreground py-8 italic">No se encontraron productos</p>
                                                            ) : (
                                                                filteredSearchProducts.map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 group rounded-md text-left transition-colors"
                                                                        onClick={() => {
                                                                            setSelectedProductId(p.id.toString());
                                                                            setSearchQuery('');
                                                                        }}
                                                                    >
                                                                        <div className="h-10 w-10 relative flex-shrink-0 bg-muted rounded overflow-hidden border">
                                                                            {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-cover" />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-medium text-sm truncate transition-colors group-hover:text-foreground">{p.name}</p>
                                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground transition-colors">
                                                                                <span className="font-mono bg-muted group-hover:bg-primary/10 px-1 rounded transition-colors text-muted-foreground group-hover:text-foreground">ID: {p.id}</span>
                                                                                {p.sku && <span className="font-mono bg-muted group-hover:bg-primary/10 px-1 rounded transition-colors text-muted-foreground group-hover:text-foreground">SKU: {p.sku}</span>}
                                                                            </div>
                                                                        </div>
                                                                        <Plus className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all" />
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                )}

                                                <div className="pt-2">
                                                    <div className="relative text-center mb-4">
                                                        <span className="absolute inset-x-0 top-1/2 border-t -translate-y-1/2"></span>
                                                        <span className="relative z-10 bg-background/50 px-2 text-[10px] text-muted-foreground uppercase tracking-tighter">O también</span>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="w-full text-xs h-10 border border-dashed hover:border-primary/50 hover:bg-primary/5"
                                                        onClick={() => setBrowsingMode('categories')}
                                                    >
                                                        Elegir manualmente desde categorías
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 pt-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <button 
                                                        onClick={resetAdvancedSearch}
                                                        className="text-[10px] font-bold flex items-center gap-1 text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                                                    >
                                                        <ChevronLeft className="h-3 w-3" /> Volver al buscador
                                                    </button>
                                                </div>

                                                {browsingMode === 'categories' && !selectedParentId && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                        <p className="text-xs font-medium text-muted-foreground px-1">Categoría Principal:</p>
                                                        <div className="grid grid-cols-1 gap-1.5">
                                                            {parentCategoriesList.map(cat => (
                                                                <Button 
                                                                    key={cat.id} 
                                                                    variant="outline" 
                                                                    className="justify-start h-auto py-2.5 px-3 text-sm hover:bg-primary/5 hover:border-primary/30 transition-all text-foreground hover:text-foreground"
                                                                    onClick={() => setSelectedParentId(cat.id)}
                                                                >
                                                                    {cat.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {browsingMode === 'categories' && selectedParentId && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                                                        <button 
                                                            onClick={() => setSelectedParentId(null)}
                                                            className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-foreground mb-1"
                                                        >
                                                            <ChevronLeft className="h-2.5 w-2.5" /> Volver a categorías principales
                                                        </button>
                                                        <p className="text-xs font-medium text-muted-foreground px-1">Sub-Categoría:</p>
                                                        <div className="grid grid-cols-1 gap-1.5">
                                                            {childCategoriesList.map(cat => (
                                                                <Button 
                                                                    key={cat.id} 
                                                                    variant="outline" 
                                                                    className="justify-start h-auto py-2.5 px-3 text-sm hover:bg-primary/5 hover:border-primary/30 transition-all text-foreground hover:text-foreground"
                                                                    onClick={() => {
                                                                        setSelectedCategoryId(cat.id);
                                                                        setBrowsingMode('products');
                                                                    }}
                                                                >
                                                                    {cat.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {browsingMode === 'products' && (
                                                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                        <button 
                                                            onClick={() => {
                                                                setBrowsingMode('categories');
                                                                setSelectedCategoryId(null);
                                                            }}
                                                            className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-foreground mb-1"
                                                        >
                                                            <ChevronLeft className="h-2.5 w-2.5" /> Volver a subcategorías
                                                        </button>
                                                        <ScrollArea className="h-56 border rounded-md bg-card">
                                                            <div className="p-2 space-y-1">
                                                                {filteredSearchProducts.length === 0 ? (
                                                                    <p className="text-xs text-center text-muted-foreground py-10">No hay productos en esta categoría</p>
                                                                ) : (
                                                                    filteredSearchProducts.map(p => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded-md text-left transition-all group"
                                                                            onClick={() => setSelectedProductId(p.id.toString())}
                                                                        >
                                                                            <div className="h-10 w-10 relative flex-shrink-0 bg-muted rounded overflow-hidden border">
                                                                                {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-cover" />}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-medium text-sm truncate group-hover:text-foreground transition-colors">{p.name}</p>
                                                                                <p className="text-[10px] text-muted-foreground font-mono group-hover:text-foreground/70 transition-colors">Stock: {p.stock}</p>
                                                                            </div>
                                                                        </button>
                                                                    )))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                </div>

                                {/* Gráfico Individual */}
                                <div className="w-full md:w-2/3 min-h-[300px] border rounded-lg p-4 bg-background/50 flex flex-col items-center justify-center">
                                    {!selectedProductId ? (
                                        <div className="text-center text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                            <p>Selecciona un producto para visualizar su rendimiento.</p>
                                        </div>
                                    ) : isProductMetricsLoading ? (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <p>Cargando historial...</p>
                                        </div>
                                    ) : productMetrics.length === 0 ? (
                                        <div className="text-center text-muted-foreground">
                                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Sin ventas registradas para este producto en {activePeriodOption.description}.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full min-h-[250px] overflow-hidden">
                                            <ScrollArea className="h-full w-full">
                                                <div style={{ 
                                                    width: productMetrics.length > 12 
                                                        ? `${productMetrics.length * 50}px` 
                                                        : '100%',
                                                    height: '250px' 
                                                }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RechartsBarChart data={productMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                            <XAxis 
                                                                dataKey="date" 
                                                                tickFormatter={(val) => {
                                                                    try { return format(parseISO(val), 'd MMM', { locale: es }); } catch { return val; }
                                                                }}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                                                dy={10}
                                                            />
                                                            <YAxis 
                                                                yAxisId="left"
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                                            />
                                                            <Tooltip 
                                                                cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
                                                                content={({ active, payload, label }) => {
                                                                    if (!active || !payload?.length) return null;
                                                                    return (
                                                                        <div className="rounded-lg border bg-background p-3 shadow-md text-sm border-primary/20">
                                                                            <p className="font-semibold mb-1 capitalize text-foreground">{
                                                                                (() => { try { return format(parseISO(label), 'EEEE d MMM', { locale: es }); } catch { return label; } })()
                                                                            }</p>
                                                                            <p className="text-primary font-medium">Unidades: {payload[0]?.value}</p>
                                                                            <p className="text-green-500 font-medium">Ingresos: ${Number(payload[0]?.payload?.revenue).toLocaleString('es-AR')}</p>
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                            <RechartsBar 
                                                                yAxisId="left"
                                                                dataKey="unitsSold" 
                                                                fill="hsl(var(--primary))" 
                                                                radius={[4, 4, 0, 0]}
                                                                maxBarSize={40}
                                                                activeBar={{ fill: 'hsl(var(--primary))', opacity: 0.8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                                                            />
                                                        </RechartsBarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rediseño Layout Individual: Fila Horizontal debajo del gráfico */}
                            {selectedProductId && !isProductMetricsLoading && productMetrics.length > 0 && (
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {/* Miniatura y Info Básica */}
                                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="h-16 w-16 relative flex-shrink-0 bg-white rounded border overflow-hidden">
                                            {products.find(p => p.id.toString() === selectedProductId)?.images?.[0] ? (
                                                <Image 
                                                    src={products.find(p => p.id.toString() === selectedProductId)!.images[0]} 
                                                    alt="" fill className="object-contain p-1" 
                                                />
                                            ) : (
                                                <Package className="h-full w-full p-4 text-muted-foreground/20" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Producto</p>
                                            <p className="text-sm font-bold truncate" title={products.find(p => p.id.toString() === selectedProductId)?.name}>
                                                {products.find(p => p.id.toString() === selectedProductId)?.name}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Precio Actual */}
                                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Precio Actual</p>
                                        <div className="flex items-baseline gap-2">
                                            {(() => {
                                                const product = products.find(p => p.id.toString() === selectedProductId);
                                                if (!product) return null;
                                                const hasDiscount = product.salePrice !== null && product.salePrice < product.price;
                                                return (
                                                    <>
                                                        <span className="text-xl font-bold text-primary">
                                                            ${(hasDiscount ? product.salePrice : product.price)?.toLocaleString('es-AR')}
                                                        </span>
                                                        {hasDiscount && (
                                                            <span className="text-xs text-muted-foreground line-through opacity-50">
                                                                ${product.price.toLocaleString('es-AR')}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Ventas en el Período */}
                                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Ventas (Período)</p>
                                        <p className="text-xl font-bold">
                                            {productMetrics.reduce((acc, curr) => acc + curr.unitsSold, 0)}
                                            <span className="text-xs font-medium text-muted-foreground ml-1.5 whitespace-nowrap">unidades</span>
                                        </p>
                                    </div>

                                    {/* Ingresos en el Período */}
                                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Ingresos (Período)</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-500">
                                            ${productMetrics.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString('es-AR')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>


                    {/* --- GEMAS VS ESTANCADOS --- */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Productos Gemas */}
                        <Card className="shadow-md border-amber-500/30 bg-amber-50/10 flex flex-col h-[500px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-amber-600">
                                    <Crown className="h-5 w-5" />
                                    Ranking de Productos Gema
                                </CardTitle>
                                <CardDescription>Ordenado por {gemSortKey === 'revenue' ? 'recaudación' : 'unidades vendidas'} en {activePeriodOption.description}.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden pt-0">
                                <ScrollArea className="h-full w-full pr-4">
                                    {isMetricsLoading || !salesMetrics ? (
                                        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                    ) : gemRankings.length > 0 ? (
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead className="text-xs font-bold w-[50%]">Producto</TableHead>
                                                    <TableHead 
                                                        className="text-right text-xs font-bold cursor-pointer hover:text-primary transition-colors select-none"
                                                        onClick={() => toggleGemSort('sold')}
                                                    >
                                                        Vendidos {gemSortKey === 'sold' && (gemSortOrder === 'desc' ? '↓' : '↑')}
                                                    </TableHead>
                                                    <TableHead 
                                                        className="text-right text-xs font-bold cursor-pointer hover:text-primary transition-colors select-none"
                                                        onClick={() => toggleGemSort('revenue')}
                                                    >
                                                        Ingresos {gemSortKey === 'revenue' && (gemSortOrder === 'desc' ? '↓' : '↑')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {gemRankings.map((p, idx) => (
                                                    <TableRow key={p.id}>
                                                        <TableCell className="text-xs py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-amber-600/50 w-4">{idx + 1}</span>
                                                                <span className="truncate max-w-[120px]" title={p.name}>{p.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs font-medium py-2">
                                                            {p.sold} <span className="text-[10px] text-muted-foreground">unid.</span>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs font-bold text-green-600 py-2">
                                                            ${p.revenue.toLocaleString('es-AR')}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="flex flex-col justify-center items-center h-full gap-2 py-20">
                                            <Crown className="h-8 w-8 text-muted-foreground opacity-20" />
                                            <p className="text-muted-foreground text-xs">Sin ventas en este período.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Productos Estancados */}
                        <Card className="shadow-md border-slate-500/30 bg-slate-50/10 flex flex-col h-[500px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                    <PackageX className="h-5 w-5" />
                                    Productos Estancados
                                </CardTitle>
                                <CardDescription>Inventario inmovilizado sin rotación en {activePeriodOption.description}.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden pt-0">
                                <ScrollArea className="h-full w-full pr-4">
                                    {isLoading || isMetricsLoading ? (
                                        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                    ) : stagnantProducts.length > 0 ? (
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead className="text-xs font-bold">Producto</TableHead>
                                                    <TableHead className="text-right text-xs font-bold">Stock Inmovilizado</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stagnantProducts.map(p => (
                                                    <TableRow key={p.id}>
                                                        <TableCell className="text-xs py-2 text-muted-foreground dark:text-slate-300">
                                                            {p.name}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs font-bold text-slate-500 py-2">
                                                            {p.stock} <span className="text-[10px] opacity-70">unid.</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="flex flex-col justify-center items-center h-full gap-2 py-20">
                                            <Package className="h-8 w-8 text-primary/20" />
                                            <p className="text-muted-foreground text-xs text-center px-4">¡Excelente rotación!<br/>No hay inventario estancado.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* SEPARADOR: ESTADO GENERAL */}
                    <div className="pt-8 pb-4 text-center">
                        <div className="flex items-center gap-4 mb-2">
                            <Separator className="flex-1" />
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap bg-muted/30 px-6 py-2 rounded-full border border-border/50 font-sans shadow-inner">
                                Estado General del Inventario
                            </h3>
                            <Separator className="flex-1" />
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground/60 font-sans max-w-lg mx-auto leading-relaxed">
                            Estas métricas reflejan el estado actual de tu stock y no se ven afectadas por el filtro de fecha actual.
                        </p>
                    </div>

                    {/* Métricas Superiores de Inventario */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <Card className="bg-muted/30 border-border/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total de Productos</p>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">{totalProducts}</div>
                                <p className="text-xs text-muted-foreground">Productos únicos en el catálogo</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-muted/30 border-border/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Valor del Inventario</p>
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">${inventoryValue.toLocaleString('es-AR')}</div>
                                <p className="text-xs text-muted-foreground">{totalStock} unidades en stock (precio × stock)</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30 border-border/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Productos Agotados</p>
                                    <PackageX className="h-4 w-4 text-destructive" />
                                </div>
                                <div className="text-2xl font-bold text-destructive">
                                    {products.filter(p => p.stock === 0).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Requieren reposición inmediata</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30 border-border/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Bajo Stock</p>
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="text-2xl font-bold text-amber-500">
                                    {products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Por debajo del umbral ({lowStockThreshold})</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Productos por Categoría Chart */}
                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle>Productos por Categoría</CardTitle>
                                <CardDescription>Cuántos productos tienes en cada categoría.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                    ) : categoryData.length > 0 ? (
                                        <div className="min-w-[600px] h-80 pr-4">
                                            <ChartContainer config={{ products: { label: "Productos", color: "hsl(var(--primary))" } }} className="h-full w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsBarChart data={categoryData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                                        <RechartsBar 
                                                            dataKey="products" 
                                                            radius={8} 
                                                            fill="#3b82f6"
                                                            activeBar={{ fill: '#60a5fa', stroke: '#60a5fa', strokeWidth: 1 }}
                                                        />
                                                    </RechartsBarChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center items-center h-80">
                                            <BarChart className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground ml-4">No hay datos de categoría.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Low Stock Alert */}
                        <Card className="shadow-md flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="text-amber-500 h-5 w-5" />
                                            Alertas de Stock
                                        </CardTitle>
                                        <CardDescription>Productos con {lowStockThreshold} unidades o menos.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1 border">
                                        <span className="text-xs text-muted-foreground px-1 hidden sm:inline-block">Umbral:</span>
                                        <div className="flex items-center">
                                            <button 
                                                className="h-6 w-6 flex items-center justify-center rounded-sm hover:bg-background border-r border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setLowStockThreshold(Math.max(0, lowStockThreshold - 1))}
                                            >
                                                -
                                            </button>
                                            <Input 
                                                type="number" 
                                                value={lowStockThreshold}
                                                onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-10 h-6 p-0 text-center border-0 bg-transparent text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                                            />
                                            <button 
                                                className="h-6 w-6 flex items-center justify-center rounded-sm hover:bg-background border-l border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setLowStockThreshold(lowStockThreshold + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ScrollArea className="h-80 w-full pr-4">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                    ) : lowStockProducts.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-right">Stock</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {lowStockProducts.map(p => (
                                                    <TableRow key={p.id}>
                                                        <TableCell className="font-medium text-xs py-2">{p.name}</TableCell>
                                                        <TableCell className={`text-right font-bold text-xs py-2 ${p.stock === 0 ? 'text-destructive' : 'text-amber-600'}`}>
                                                            {p.stock === 0 ? 'Agotado' : p.stock}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="flex flex-col justify-center items-center h-full gap-3 py-10">
                                            <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                                            <p className="text-muted-foreground text-sm">¡Todo bien! No hay productos con bajo stock.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                </TabsContent>
            </Tabs>
        </div>
    );
}
