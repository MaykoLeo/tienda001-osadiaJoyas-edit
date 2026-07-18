'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // <--- IMPORTADO
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, FileDown, PlusCircle, Trash2, Pencil, Search, ChevronsUpDown, ArrowUp, ArrowDown, X, ChevronRight } from "lucide-react";
import type { Product, Category } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 25;

// Componente memoizado para cada fila de producto
const ProductRow = React.memo(({
    product,
    categories,
    featuredCount,
    isLoading,
    onEdit,
    onDelete,
    onToggleFeatured
}: {
    product: Product;
    categories: Category[];
    featuredCount: number;
    isLoading: boolean;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    onToggleFeatured: (productId: number, featured: boolean) => void;
}) => {
    const hasActiveDiscount = product.salePrice != null && product.salePrice < product.price;

    const getCategoryNames = (categoryIds: number[]) => {
        return categoryIds
            .map(id => categories.find(c => c.id === id)?.name)
            .filter(Boolean)
            .map(name => <Badge key={name} variant="outline" className="mr-1 mb-1 bg-muted">{name}</Badge>);
    };

    return (
        <TableRow style={{ cursor: isLoading ? 'wait' : 'default' }} className={cn(isLoading && "opacity-60 pointer-events-none")}>
            <TableCell>
                <img
                    alt={product.name}
                    className="aspect-square rounded-md object-cover"
                    height="48"
                    src={product.images[0] || '/placeholder.svg'}
                    width="48"
                    loading="lazy"
                />
            </TableCell>
            <TableCell className="font-mono text-xs text-center">#{product.id}</TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell className="hidden lg:table-cell text-center">
                {hasActiveDiscount ? (
                    <div>
                        <span className="line-through text-muted-foreground">{formatCurrency(product.price)}</span>
                        <br />
                        <span className="text-red-500 font-bold">{formatCurrency(product.salePrice!)}</span>
                    </div>
                ) : (
                    formatCurrency(product.price)
                )}
            </TableCell>
        <TableCell className="hidden md:table-cell text-center">
                {(() => {
                    const effectivePct = product.effectiveDiscountPercentage;
                    if (!hasActiveDiscount || !effectivePct) return <span className="text-muted-foreground">-</span>;
                    const isOnlyFromCategory = !product.discountPercentage || product.discountPercentage <= 0;
                    return (
                        <Badge variant="destructive" title={isOnlyFromCategory ? 'Descuento heredado de categor\u00eda' : 'Descuento individual'}>
                            {`-${effectivePct}%`}
                            {isOnlyFromCategory && <span className="ml-1 opacity-80" aria-label="de categor\u00eda">🏷️</span>}
                        </Badge>
                    );
                })()}
            </TableCell>
            <TableCell className="hidden md:table-cell text-center">{product.stock}</TableCell>
            <TableCell className="hidden lg:table-cell">{getCategoryNames(product.categoryIds)}</TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    <Switch
                        checked={product.featured || false}
                        onCheckedChange={(checked) => onToggleFeatured(product.id, checked)}
                        disabled={isLoading || (!product.featured && featuredCount >= 8)}
                    />
                    {product.featured && <span className="text-xs">⭐</span>}
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="icon" onClick={() => onEdit(product)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            </TableCell>
        </TableRow>
    );
}, (prevProps, nextProps) => {
    // Solo re-renderizar si alguna de estas props cambió
    return prevProps.product.id === nextProps.product.id &&
        prevProps.product.name === nextProps.product.name &&
        prevProps.product.price === nextProps.product.price &&
        prevProps.product.stock === nextProps.product.stock &&
        prevProps.product.salePrice === nextProps.product.salePrice &&
        prevProps.product.featured === nextProps.product.featured &&
        prevProps.product.discountPercentage === nextProps.product.discountPercentage &&
        prevProps.product.effectiveDiscountPercentage === nextProps.product.effectiveDiscountPercentage &&
        prevProps.featuredCount === nextProps.featuredCount &&
        prevProps.isLoading === nextProps.isLoading &&
        // Comparar categoryIds para detectar cambios de categorías
        prevProps.product.categoryIds.length === nextProps.product.categoryIds.length &&
        prevProps.product.categoryIds.every((id, i) => id === nextProps.product.categoryIds[i]);
});

ProductRow.displayName = 'ProductRow';

// Tipos para el árbol de categorías
type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

// Función para construir el árbol de categorías
function buildCategoryTree(categories: Category[], parentId: number | null = null): CategoryTreeNode[] {
    return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
            ...cat,
            children: buildCategoryTree(categories, cat.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Componente recursivo para mostrar categorías en árbol
function CategoryTreeItem({
    category,
    selectedIds,
    onToggle,
    searchTerm,
    level = 0
}: {
    category: CategoryTreeNode;
    selectedIds: number[];
    onToggle: (id: number) => void;
    searchTerm: string;
    level?: number;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = category.children.length > 0;
    const isSelected = selectedIds.includes(category.id);

    // Highlight si coincide con búsqueda
    const matches = searchTerm ? category.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;

    // Auto-expand si la búsqueda coincide con algún hijo
    const hasMatchingChild = useMemo(() => {
        if (!searchTerm) return false;
        const checkChildren = (cats: CategoryTreeNode[]): boolean => {
            return cats.some(cat =>
                cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                checkChildren(cat.children)
            );
        };
        return checkChildren(category.children);
    }, [category.children, searchTerm]);

    useEffect(() => {
        if (searchTerm && (matches || hasMatchingChild)) {
            setIsOpen(true);
        }
    }, [searchTerm, matches, hasMatchingChild]);

    return (
        <div>
            <div
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 rounded-sm transition-colors"
                style={{ paddingLeft: `${8 + level * 16}px` }}
            >
                {hasChildren ? (
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 cursor-pointer transition-transform flex-shrink-0",
                            isOpen && "rotate-90"
                        )}
                        onClick={() => setIsOpen(!isOpen)}
                    />
                ) : (
                    <div className="w-4" />
                )}
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(category.id)}
                    className="flex-shrink-0"
                />
                <span className={cn(
                    "text-sm cursor-pointer flex-1",
                    matches && "font-semibold text-primary"
                )}
                    onClick={() => onToggle(category.id)}
                >
                    {category.name}
                </span>
                {hasChildren && (
                    <span className="text-xs text-muted-foreground">
                        ({category.children.length})
                    </span>
                )}
            </div>

            {hasChildren && isOpen && (
                <div>
                    {category.children.map(child => (
                        <CategoryTreeItem
                            key={child.id}
                            category={child}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                            searchTerm={searchTerm}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ProductsTab({
    products,
    isLoading,
    onAdd,
    onEdit,
    onDelete,
    onExport,
    onImport,
    onToggleFeatured,
    categories
}: {
    products: Product[];
    isLoading: boolean;
    onAdd: () => void;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    onExport: () => void;
    onImport: () => void;
    onToggleFeatured: (productId: number, featured: boolean) => Promise<void>;
    categories: Category[];
}) {
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Estados de filtros avanzados
    const [categoryFilter, setCategoryFilter] = useState<number[]>([]);
    const [categorySearch, setCategorySearch] = useState(''); // Búsqueda de categorías
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low' | 'normal' | 'high'>('all');
    const [discountFilter, setDiscountFilter] = useState<'all' | 'with' | 'without'>('all');
    const [featuredCount, setFeaturedCount] = useState(0);
    const [loadingProductIds, setLoadingProductIds] = useState<Set<number>>(new Set());
    // Rastrea qué acción está pendiente para cada producto en loading (add=marcar, remove=desmarcar)
    const [pendingActions, setPendingActions] = useState<Map<number, 'add' | 'remove'>>(new Map());

    // Construir árbol de categorías
    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    // Debounce de la búsqueda para mejorar rendimiento
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Calcular productos destacados (incluyendo operaciones pendientes)
    const optimisticFeaturedCount = useMemo(() => {
        let count = products.filter(p => p.featured).length;

        // Ajustar por operaciones pendientes
        pendingActions.forEach((action, productId) => {
            const product = products.find(p => p.id === productId);
            if (product) {
                if (action === 'add' && !product.featured) {
                    count++; // Suma si se está marcando como featured
                } else if (action === 'remove' && product.featured) {
                    count--; // Resta si se está desmarcando
                }
            }
        });

        return count;
    }, [products, pendingActions]);

    // Actualizar featuredCount real cuando products cambia
    useEffect(() => {
        const count = products.filter(p => p.featured).length;
        setFeaturedCount(count);
    }, [products]);

    type SortableKeys = 'id' | 'name' | 'price' | 'discountPercentage' | 'stock' | 'category' | 'featured';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });

    const sortedProducts = useMemo(() => {
        let sortableItems = [...products];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any;
                let bValue: any;

                if (key === 'discountPercentage') {
                    aValue = a.effectiveDiscountPercentage ?? (a.salePrice != null && a.salePrice < a.price ? a.discountPercentage : null);
                    bValue = b.effectiveDiscountPercentage ?? (b.salePrice != null && b.salePrice < b.price ? b.discountPercentage : null);
                } else if (key === 'category') {
                    aValue = a.categoryIds.map(id => categories.find(c => c.id === id)?.name || '').join(', ');
                    bValue = b.categoryIds.map(id => categories.find(c => c.id === id)?.name || '').join(', ');
                } else if (key === 'featured') {
                    aValue = a.featured ? 1 : 0;
                    bValue = b.featured ? 1 : 0;
                } else {
                    aValue = a[key as keyof Product];
                    bValue = b[key as keyof Product];
                }

                if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
                if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [products, sortConfig, categories]);

    const filteredProducts = useMemo(() => {
        let filtered = sortedProducts;

        // Filtro de búsqueda por texto
        const lowercasedQuery = debouncedSearchTerm.toLowerCase();
        if (lowercasedQuery) {
            filtered = filtered.filter(product => {
                const categoryNames = product.categoryIds.map(id => categories.find(c => c.id === id)?.name || '').join(' ');
                const fieldsToSearch = [
                    product.id.toString(),
                    product.name,
                    product.sku || '',
                    categoryNames
                ];
                return fieldsToSearch.some(field => field.toLowerCase().includes(lowercasedQuery));
            });
        }

        // Filtro de categoría
        if (categoryFilter.length > 0) {
            filtered = filtered.filter(product =>
                product.categoryIds.some(id => categoryFilter.includes(id))
            );
        }

        // Filtro de precio
        const minPrice = priceMin ? parseFloat(priceMin) : 0;
        const maxPrice = priceMax ? parseFloat(priceMax) : Infinity;
        if (priceMin || priceMax) {
            filtered = filtered.filter(product => {
                const price = product.salePrice || product.price;
                return price >= minPrice && price <= maxPrice;
            });
        }

        // Filtro de stock
        if (stockFilter !== 'all') {
            filtered = filtered.filter(product => {
                if (stockFilter === 'out') return product.stock === 0;
                if (stockFilter === 'low') return product.stock > 0 && product.stock <= 5;
                if (stockFilter === 'normal') return product.stock >= 6 && product.stock <= 20;
                if (stockFilter === 'high') return product.stock > 20;
                return true;
            });
        }

        // Filtro de descuento
        if (discountFilter !== 'all') {
            filtered = filtered.filter(product => {
                const hasDiscount = product.salePrice != null && product.salePrice < product.price;
                if (discountFilter === 'with') return hasDiscount;
                if (discountFilter === 'without') return !hasDiscount;
                return true;
            });
        }

        return filtered;
    }, [sortedProducts, debouncedSearchTerm, categories, categoryFilter, priceMin, priceMax, stockFilter, discountFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/70" />;
        }
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderHeaderButton = (key: SortableKeys, label: string, className: string = "") => (
        <Button variant="ghost" onClick={() => requestSort(key)} className={cn("px-2 h-8", className)}>
            {label}{getSortIcon(key)}
        </Button>
    );

    // Wrapper para manejar el loading state del toggle featured
    const handleToggleFeaturedWithLoading = async (productId: number, featured: boolean) => {
        // Usar flushSync para forzar un render síncrono del estado de loading
        // Esto asegura que el UI se actualice ANTES de la operación async
        flushSync(() => {
            setLoadingProductIds(prev => new Set(prev).add(productId));

            // Registrar la acción pendiente para el contador optimista
            setPendingActions(prev => {
                const newMap = new Map(prev);
                newMap.set(productId, featured ? 'add' : 'remove');
                return newMap;
            });
        });

        try {
            await onToggleFeatured(productId, featured);
        } finally {
            // Remover del set de loading y pendingActions
            setLoadingProductIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });

            setPendingActions(prev => {
                const newMap = new Map(prev);
                newMap.delete(productId);
                return newMap;
            });
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(inputValue.trim());
        setCurrentPage(1);
    };

    // Limpiar todos los filtros
    const clearFilters = () => {
        setCategoryFilter([]);
        setPriceMin('');
        setPriceMax('');
        setStockFilter('all');
        setDiscountFilter('all');
        setCurrentPage(1);
    };

    // Validar input de precio (solo números)
    const handlePriceInput = (value: string, setter: (val: string) => void) => {
        // Permitir solo números y punto decimal
        const sanitized = value.replace(/[^0-9.]/g, '');
        // Evitar múltiples puntos
        const parts = sanitized.split('.');
        const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
        setter(formatted);
    };

    // Toggle categoría en filtro
    const toggleCategoryFilter = (categoryId: number) => {
        setCategoryFilter(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
        setCurrentPage(1);
    };

    // Contador de filtros activos
    const activeFiltersCount = [
        categoryFilter.length > 0,
        priceMin || priceMax,
        stockFilter !== 'all',
        discountFilter !== 'all'
    ].filter(Boolean).length;

    const getCategoryNames = (categoryIds: number[]) => {
        return categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).map(name => <Badge key={name} variant="outline" className="mr-1 mb-1 bg-muted">{name}</Badge>);
    }

    // --- ESTRUCTURA MODIFICADA ---
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <CardTitle>Gestionar Productos</CardTitle>
                            <CardDescription>Añade, edita o elimina productos de tu catálogo.</CardDescription>
                        </div>
                        <Badge variant={featuredCount >= 8 ? 'destructive' : 'secondary'} className="ml-2">
                            ⭐ {featuredCount}/8
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start md:self-auto">
                        <Button variant="outline" onClick={onImport} size="sm"><FileUp className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Importar</span></Button>
                        <Button variant="outline" onClick={onExport} size="sm"><FileDown className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Exportar</span></Button>
                        <Button onClick={onAdd} size="sm"><PlusCircle className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Añadir Producto</span><span className="sm:hidden">Añadir</span></Button>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="pt-4 mt-4 border-t">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, SKU, categoría..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="pl-10"
                                autoComplete="new-password"
                                name="search-products-admin"
                                data-form-type="other"
                            />
                        </div>
                        <Button type="submit">Buscar</Button>
                    </form>
                </div>

                {/* Filtros Avanzados */}
                <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Filtros:</h4>
                        {activeFiltersCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                                <X className="mr-1 h-3 w-3" />
                                Limpiar Filtros ({activeFiltersCount})
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Filtro de Categoría MEJORADO */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted-foreground">Categoría</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[220px] justify-between">
                                        <span className="truncate">
                                            {categoryFilter.length > 0
                                                ? `${categoryFilter.length} seleccionada${categoryFilter.length > 1 ? 's' : ''}`
                                                : 'Todas las categorías'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[350px] p-0" align="start">
                                    {/* Búsqueda */}
                                    <div className="p-3 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar categoría..."
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                className="h-9 pl-8"
                                            />
                                        </div>
                                    </div>

                                    {/* Árbol jerárquico con checkboxes */}
                                    <ScrollArea className="h-[320px]">
                                        <div className="p-2">
                                            {categoryTree.length > 0 ? (
                                                categoryTree.map(category => (
                                                    <CategoryTreeItem
                                                        key={category.id}
                                                        category={category}
                                                        selectedIds={categoryFilter}
                                                        onToggle={toggleCategoryFilter}
                                                        searchTerm={categorySearch}
                                                    />
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No hay categorías disponibles
                                                </p>
                                            )}
                                        </div>
                                    </ScrollArea>

                                    {/* Footer con acciones */}
                                    <div className="p-2 border-t flex justify-between items-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setCategoryFilter([]);
                                                setCurrentPage(1);
                                            }}
                                            disabled={categoryFilter.length === 0}
                                        >
                                            Limpiar
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {categoryFilter.length} seleccionadas
                                        </span>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Tags de categorías seleccionadas */}
                            {categoryFilter.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1 max-w-[220px]">
                                    {categoryFilter.slice(0, 3).map(id => {
                                        const cat = categories.find(c => c.id === id);
                                        return cat ? (
                                            <Badge key={id} variant="secondary" className="text-xs pl-2 pr-1">
                                                {cat.name}
                                                <X
                                                    className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCategoryFilter(id);
                                                    }}
                                                />
                                            </Badge>
                                        ) : null;
                                    })}
                                    {categoryFilter.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{categoryFilter.length - 3} más
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Filtro de Precio */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted-foreground">Precio</label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Mín"
                                    value={priceMin}
                                    onChange={(e) => handlePriceInput(e.target.value, setPriceMin)}
                                    className="w-24"
                                    inputMode="numeric"
                                />
                                <span className="self-center text-muted-foreground">-</span>
                                <Input
                                    type="text"
                                    placeholder="Máx"
                                    value={priceMax}
                                    onChange={(e) => handlePriceInput(e.target.value, setPriceMax)}
                                    className="w-24"
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        {/* Filtro de Stock */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted-foreground">Stock</label>
                            <Select value={stockFilter} onValueChange={(val) => { setStockFilter(val as any); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todo el Stock</SelectItem>
                                    <SelectItem value="out">Sin stock (0)</SelectItem>
                                    <SelectItem value="low">Stock bajo (1-5)</SelectItem>
                                    <SelectItem value="normal">Stock normal (6-20)</SelectItem>
                                    <SelectItem value="high">Stock alto (&gt;20)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro de Descuento */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted-foreground">Descuento</label>
                            <Select value={discountFilter} onValueChange={(val) => { setDiscountFilter(val as any); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="with">Con descuento</SelectItem>
                                    <SelectItem value="without">Sin descuento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Contador de resultados */}
                    <p className="text-sm text-muted-foreground">
                        Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
                    </p>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[56px]">Img</TableHead>
                                <TableHead className="w-[110px] text-center">{renderHeaderButton('id', 'ID')}</TableHead>
                                <TableHead>{renderHeaderButton('name', 'Nombre')}</TableHead>
                                <TableHead className="hidden lg:table-cell text-center">{renderHeaderButton('price', 'Precio')}</TableHead>
                                <TableHead className="hidden md:table-cell text-center">{renderHeaderButton('discountPercentage', 'Descuento')}</TableHead>
                                <TableHead className="hidden md:table-cell text-center">{renderHeaderButton('stock', 'Stock')}</TableHead>
                                <TableHead className="hidden lg:table-cell">Categorías</TableHead>
                                <TableHead className="text-center w-[160px]">
                                    {renderHeaderButton('featured', `Destacado ⭐ ${optimisticFeaturedCount}/8`)}
                                </TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">Cargando productos...</TableCell>
                                </TableRow>
                            ) : paginatedProducts.length > 0 ? (
                                paginatedProducts.map(product => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        categories={categories}
                                        featuredCount={optimisticFeaturedCount}
                                        isLoading={loadingProductIds.has(product.id)}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleFeatured={handleToggleFeaturedWithLoading}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">No se encontraron productos.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center py-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
