'use client';

import { useState, useMemo, useEffect } from 'react';
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import type { Product, Coupon, Category } from '@/lib/types';
import { ImageUploader } from './ImageUploader';

type FieldErrors = Record<string, string[] | undefined>;

// Tipos para el árbol de categorías
type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

// Función para construir el árbol de categorías recursivamente
function buildCategoryTree(categories: Category[], parentId: number | null = null): CategoryTreeNode[] {
    return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
            ...cat,
            children: buildCategoryTree(categories, cat.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Devuelve todos los IDs de los ancestros (padre, abuelo, etc.) de una categoría
function getAncestorIds(categoryId: number, categories: Category[]): number[] {
    const ancestors: number[] = [];
    let current = categories.find(c => c.id === categoryId);
    while (current?.parentId != null) {
        ancestors.push(current.parentId);
        current = categories.find(c => c.id === current!.parentId);
    }
    return ancestors;
}

// Devuelve todos los IDs de los descendientes (hijos, nietos, etc.) de una categoría
function getDescendantIds(categoryId: number, categories: Category[]): number[] {
    const descendants: number[] = [];
    const directChildren = categories.filter(c => c.parentId === categoryId);
    for (const child of directChildren) {
        descendants.push(child.id);
        descendants.push(...getDescendantIds(child.id, categories));
    }
    return descendants;
}

// Componente recursivo para mostrar categorías con checkboxes (N niveles)
function CategoryCheckboxItem({
    category,
    selectedIds,
    onCategoryChange,
    level = 0,
    parentName = ''
}: {
    category: CategoryTreeNode;
    selectedIds: number[];
    onCategoryChange: (id: number, isChecked: boolean) => void;
    level?: number;
    parentName?: string;
}) {
    const [isOpen, setIsOpen] = useState(category.children.length > 0); // Auto-expandir si tiene hijos
    const hasChildren = category.children.length > 0;
    const isSelected = selectedIds.includes(category.id);

    return (
        <div>
            <div
                className="flex items-center gap-2 py-1.5 hover:bg-accent/30 rounded-sm transition-colors"
                style={{ paddingLeft: `${8 + level * 16}px` }}
            >
                {hasChildren ? (
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 cursor-pointer transition-transform flex-shrink-0 text-muted-foreground",
                            isOpen && "rotate-90"
                        )}
                        onClick={() => setIsOpen(!isOpen)}
                    />
                ) : (
                    <div className="w-4" />
                )}
                <Checkbox
                    id={`category-${category.id}`}
                    checked={isSelected}
                    onCheckedChange={(isChecked) => onCategoryChange(category.id, isChecked === true)}
                    className="flex-shrink-0"
                />
                <Label
                    htmlFor={`category-${category.id}`}
                    className={cn(
                        "font-normal cursor-pointer flex-1",
                        level === 0 && "font-semibold",
                        !hasChildren && parentName && "text-sm"
                    )}
                >
                    {category.name}
                    {hasChildren && (
                        <span className="text-xs text-muted-foreground ml-1">({category.children.length})</span>
                    )}
                </Label>
            </div>

            {hasChildren && isOpen && (
                <div>
                    {category.children.map(child => (
                        <CategoryCheckboxItem
                            key={child.id}
                            category={child}
                            selectedIds={selectedIds}
                            onCategoryChange={onCategoryChange}
                            level={level + 1}
                            parentName={category.name}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const handleDecimalKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(event.key)) {
        event.preventDefault();
    }
};

const handleIntegerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
        event.preventDefault();
    }
};

const FormError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return <p className="text-sm font-medium text-destructive mt-1">{message}</p>;
};

export function ProductForm({
    product,
    formId,
    errors,
    categories,
    imageUrls,
    onImageUrlsChange,
    onImageRemove,
}: {
    product?: Product,
    formId: string,
    errors: FieldErrors,
    categories: Category[],
    imageUrls: string[],
    onImageUrlsChange: (urls: string[]) => void;
    onImageRemove: (url: string) => void;
}) {
    const [startDate, setStartDate] = useState<Date | undefined>(product?.offerStartDate ? new Date(product.offerStartDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(product?.offerEndDate ? new Date(product.offerEndDate) : undefined);
    const [isStartDatePickerOpen, setStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setEndDatePickerOpen] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(product?.categoryIds ?? []);

    const handleCategoryChange = (categoryId: number, isChecked: boolean) => {
        setSelectedCategoryIds(prevIds => {
            if (isChecked) {
                // Al seleccionar, también agregar todos los ancestros automáticamente
                const ancestorIds = getAncestorIds(categoryId, categories);
                return [...new Set([...prevIds, categoryId, ...ancestorIds])];
            } else {
                // Al deseleccionar, también quitar todos los descendientes
                const descendantIds = getDescendantIds(categoryId, categories);
                const toRemove = new Set([categoryId, ...descendantIds]);
                return prevIds.filter(id => !toRemove.has(id));
            }
        });
    };

    // Sincronizar selectedCategoryIds cuando el producto cambia
    useEffect(() => {
        setSelectedCategoryIds(product?.categoryIds ?? []);
    }, [product?.categoryIds]);

    // Construir árbol de categorías recursivo
    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    const HiddenInputs = () => {
        console.log('[Forms] selectedCategoryIds:', selectedCategoryIds); // DEBUG
        return (
            <>
                <input type="hidden" name="offerStartDate" value={startDate?.toISOString() ?? ''} />
                <input type="hidden" name="offerEndDate" value={endDate?.toISOString() ?? ''} />
                {/* Siempre enviar categoryIds, incluso si está vacío */}
                {selectedCategoryIds.length === 0 ? (
                    <input type="hidden" name="categoryIds" value="" />
                ) : (
                    selectedCategoryIds.map(id => (
                        <input key={`cat_hidden_${id}`} type="hidden" name="categoryIds" value={String(id)} />
                    ))
                )}
                <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />
            </>
        );
    };

    return (
        <form id={formId} className="space-y-4">
            <HiddenInputs />
            <div><Label htmlFor="name">Nombre *</Label><Input id="name" name="name" defaultValue={product?.name} className={cn("border-2", errors.name && "border-destructive")} /><FormError message={errors.name?.[0]} /></div>
            <div><Label htmlFor="shortDescription">Descripción Corta</Label><Input id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription} placeholder="Un resumen breve para la tarjeta de producto." className={cn("border-2", errors.shortDescription && "border-destructive")} /><FormError message={errors.shortDescription?.[0]} /></div>
            <div><Label htmlFor="description">Descripción Completa *</Label><Textarea id="description" name="description" defaultValue={product?.description} className={cn("border-2", errors.description && "border-destructive")} /><FormError message={errors.description?.[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="price">Precio *</Label><Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} onKeyDown={handleDecimalKeyDown} className={cn("border-2", errors.price && "border-destructive")} /><FormError message={errors.price?.[0]} /></div>
                <div><Label htmlFor="discountPercentage">Descuento (%)</Label><Input id="discountPercentage" name="discountPercentage" type="number" step="1" min="0" max="100" defaultValue={product?.discountPercentage ?? ''} onKeyDown={handleIntegerKeyDown} placeholder="Ej: 15" className={cn("border-2", errors.discountPercentage && "border-destructive")} /><FormError message={errors.discountPercentage?.[0]} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Inicio de Oferta</Label>
                    <Popover modal={true} open={isStartDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("border-2 w-full justify-start text-left font-normal", !startDate && "text-muted-foreground", errors.offerStartDate && "border-destructive")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverPrimitive.Portal>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        setStartDate(date);
                                        setStartDatePickerOpen(false);
                                    }}
                                    initialFocus
                                    fromDate={new Date()}
                                />
                            </PopoverContent>
                        </PopoverPrimitive.Portal>
                    </Popover>
                    <FormError message={errors.offerStartDate?.[0]} />
                </div>
                <div>
                    <Label>Fin de Oferta</Label>
                    <Popover modal={true} open={isEndDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("border-2 w-full justify-start text-left font-normal", !endDate && "text-muted-foreground", errors.offerEndDate && "border-destructive")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverPrimitive.Portal>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => {
                                        setEndDate(date);
                                        setEndDatePickerOpen(false);
                                    }}
                                    initialFocus
                                    fromDate={startDate || new Date()}
                                />
                            </PopoverContent>
                        </PopoverPrimitive.Portal>
                    </Popover>
                    <FormError message={errors.offerEndDate?.[0]} />
                </div>
            </div>
            <div>
                <Label>Categorías *</Label>
                <ScrollArea className="h-64 w-full rounded-md border-2 p-3">
                    {categoryTree.length > 0 ? (
                        <div className="space-y-1">
                            {categoryTree.map(category => (
                                <CategoryCheckboxItem
                                    key={category.id}
                                    category={category}
                                    selectedIds={selectedCategoryIds}
                                    onCategoryChange={handleCategoryChange}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay categorías disponibles
                        </p>
                    )}
                </ScrollArea>
                <FormError message={errors.categoryIds?.[0]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="stock">Stock *</Label>
                    <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock} onKeyDown={handleIntegerKeyDown} className={cn("border-2", errors.stock && "border-destructive")} />
                    <FormError message={errors.stock?.[0]} />
                </div>
                <div>
                    <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                    <Input id="sku" name="sku" defaultValue={product?.sku} placeholder="Ej: REM-NEG-S" className={cn("border-2", errors.sku && "border-destructive")} />
                    <FormError message={errors.sku?.[0]} />
                </div>
            </div>
            <div className='space-y-2'>
                <Label>Imágenes del Producto (Max: 4) *</Label>
                <ImageUploader
                    imageUrls={imageUrls}
                    onImageUrlsChange={onImageUrlsChange}
                    onImageRemove={onImageRemove}
                />
                <FormError message={errors.images?.[0]} />
            </div>
            <p className="text-sm text-muted-foreground pt-2">Los campos con * son obligatorios.</p>
        </form>
    );
}

export function CouponForm({ coupon, formId, errors }: { coupon?: Coupon, formId: string, errors: FieldErrors }) {
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(coupon?.expiryDate ? new Date(coupon.expiryDate) : undefined);
    const [isExpiryDatePickerOpen, setExpiryDatePickerOpen] = useState(false);

    const HiddenDateInputs = () => (
        <input type="hidden" name="expiryDate" value={expiryDate?.toISOString() ?? ''} />
    );

    return (
        <form id={formId} className="space-y-4">
            <HiddenDateInputs />
            <div><Label htmlFor="code">Código del Cupón *</Label><Input id="code" name="code" defaultValue={coupon?.code} placeholder="VERANO20" className={cn("border-2", errors.code && "border-destructive")} /><FormError message={errors.code?.[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="discountType">Tipo de Descuento *</Label>
                    <Select name="discountType" defaultValue={coupon?.discountType ?? 'percentage'}>
                        <SelectTrigger className={cn("border-2", errors.discountType && "border-destructive")}><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormError message={errors.discountType?.[0]} />
                </div>
                <div>
                    <Label htmlFor="discountValue">Valor *</Label>
                    <Input id="discountValue" name="discountValue" type="number" step="0.01" min="0" defaultValue={coupon?.discountValue} onKeyDown={handleDecimalKeyDown} placeholder="Ej: 20" className={cn("border-2", errors.discountValue && "border-destructive")} />
                    <FormError message={errors.discountValue?.[0]} />
                </div>
            </div>
            <div>
                <Label htmlFor="minPurchaseAmount">Compra Mínima (Opcional)</Label>
                <Input id="minPurchaseAmount" name="minPurchaseAmount" type="number" step="0.01" min="0" defaultValue={coupon?.minPurchaseAmount ?? ''} onKeyDown={handleDecimalKeyDown} placeholder="Ej: 5000" className={cn("border-2", errors.minPurchaseAmount && "border-destructive")} />
                <FormError message={errors.minPurchaseAmount?.[0]} />
            </div>
            <div>
                <Label>Fecha de Expiración <span className="text-xs text-muted-foreground">(Vacío = Sin Expiración)</span></Label>
                <Popover modal={true} open={isExpiryDatePickerOpen} onOpenChange={setExpiryDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("border-2 w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground", errors.expiryDate && "border-destructive")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />{expiryDate ? format(expiryDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverPrimitive.Portal>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={expiryDate}
                                onSelect={(date) => {
                                    setExpiryDate(date);
                                    setExpiryDatePickerOpen(false);
                                }}
                                initialFocus
                                fromDate={new Date()}
                            />
                        </PopoverContent>
                    </PopoverPrimitive.Portal>
                </Popover>
                <FormError message={errors.expiryDate?.[0]} />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked={coupon?.isActive ?? true} />
                <Label htmlFor="isActive">Cupón Activo</Label>
            </div>
            <p className="text-sm text-muted-foreground pt-2">Los campos con * son obligatorios.</p>
        </form>
    );
}
