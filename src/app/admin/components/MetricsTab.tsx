"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Wallet, DollarSign, ShoppingCart, TrendingUp, AlertTriangle, BarChart } from 'lucide-react';
import type { Product, SalesMetrics, Category } from '@/lib/types';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart as RechartsAreaChart, Area } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from 'react';

type PeriodKey = '7d' | '30d' | '90d' | 'year' | 'all';

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
    isLoading,
    isMetricsLoading,
    categories,
    onPeriodChange,
}: {
    products: Product[];
    salesMetrics: SalesMetrics | null;
    isLoading: boolean;
    isMetricsLoading: boolean;
    categories: Category[];
    onPeriodChange: (startDate?: Date, endDate?: Date) => void;
}) {
    const [activePeriod, setActivePeriod] = useState<PeriodKey>('all');
    const [chartType, setChartType] = useState<'revenue' | 'orders'>('revenue');

    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const inventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockProducts = products.filter(p => p.stock >= 0 && p.stock <= 3);

    const activePeriodOption = PERIOD_OPTIONS.find(p => p.key === activePeriod)!;

    const handlePeriodChange = useCallback((periodKey: PeriodKey) => {
        setActivePeriod(periodKey);
        const option = PERIOD_OPTIONS.find(p => p.key === periodKey)!;
        const { startDate, endDate } = option.getDates();
        onPeriodChange(startDate, endDate);
    }, [onPeriodChange]);

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
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Revenue / Orders Over Time Chart */}
                        <Card className="shadow-md">
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
                                    <div className="h-64 overflow-x-auto overflow-y-hidden pb-4">
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
                        <Card className="shadow-md">
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
                                                {salesMetrics.topSellingProducts.map((p, idx) => (
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
                    {/* Products KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Total de Productos — estático */}
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalProducts}
                                </div>
                                <p className="text-xs text-muted-foreground">Productos únicos en el catálogo</p>
                            </CardContent>
                        </Card>

                        {/* Valor del Inventario — reemplaza "Inventario Total unidades" */}
                        <Card className="shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isLoading
                                        ? <Loader2 className="h-8 w-8 animate-spin" />
                                        : `$${inventoryValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                                </div>
                                <p className="text-xs text-muted-foreground">{totalStock} unidades en stock (precio × stock)</p>
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
                                                        <RechartsBar dataKey="products" radius={8} />
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
                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="text-amber-500" />
                                    Alertas de Stock Bajo
                                </CardTitle>
                                <CardDescription>Productos con 3 unidades o menos en stock, incluyendo agotados.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                    ) : lowStockProducts.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-right">Stock Restante</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {lowStockProducts.map(p => (
                                                    <TableRow key={p.id}>
                                                        <TableCell className="font-medium">{p.name}</TableCell>
                                                        <TableCell className={`text-right font-bold ${p.stock === 0 ? 'text-destructive' : 'text-amber-600'}`}>
                                                            {p.stock === 0 ? 'Agotado' : p.stock}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="flex justify-center items-center h-24 gap-3">
                                            <Package className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">¡Todo bien! No hay productos con bajo stock.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
