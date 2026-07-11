"use client";

import { useState, useMemo, useRef } from 'react';
import type { Category, CategoryDiscount } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Trash2, Loader2, Edit, CornerDownRight, ChevronRight, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/actions/category-actions';
import { addCategoryDiscountAction, updateCategoryDiscountAction, deleteCategoryDiscountAction, toggleCategoryDiscountActiveAction } from '@/app/actions/category-discount-actions';
import { CategoryDiscountForm } from './Forms';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type CategoryTreeNode = Category & { children: CategoryTreeNode[] };


function EditCategoryDialog({ category, onActionComplete }: { category: CategoryTreeNode, onActionComplete: () => void }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddingChild, setIsAddingChild] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const addChildFormRef = useRef<HTMLFormElement>(null);

    const handleUpdateName = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsUpdating(true);
        const formData = new FormData(event.currentTarget);
        const result = await updateCategoryAction(category.id, formData);
        setIsUpdating(false);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: "Nombre de la categoría actualizado." });
            setIsOpen(false);
            onActionComplete();
        }
    };

    const handleAddChild = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsAddingChild(true);
        const formData = new FormData(event.currentTarget);
        formData.append('parentId', String(category.id));
        const result = await addCategoryAction(formData);
        setIsAddingChild(false);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: "Subcategoría añadida." });
            addChildFormRef.current?.reset();
            setIsOpen(false);
            onActionComplete();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Editar / Añadir</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Categoría: {category.name}</DialogTitle>
                    <DialogDescription>Modifica el nombre o añade nuevas subcategorías.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <form onSubmit={handleUpdateName} className="space-y-3">
                        <label htmlFor="name" className="font-semibold text-sm">Editar nombre</label>
                        <div className="flex gap-2">
                            <Input id="name" name="name" defaultValue={category.name} required />
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                            </Button>
                        </div>
                    </form>
                    <div className='border-b'></div>
                    <form ref={addChildFormRef} onSubmit={handleAddChild} className="space-y-3">
                        <label htmlFor="childName" className="font-semibold text-sm">Añadir subcategoría</label>
                        <div className="flex gap-2">
                            <Input id="childName" name="name" placeholder="Nombre de la nueva subcategoría" required />
                            <Button type="submit" variant="secondary" disabled={isAddingChild}>
                                {isAddingChild ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Añadir
                            </Button>
                        </div>
                    </form>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Componente recursivo para renderizar categorías de cualquier nivel
function CategoryNode({
    category,
    level = 0,
    onActionComplete,
    onDelete
}: {
    category: CategoryTreeNode;
    level?: number;
    onActionComplete: () => void;
    onDelete: (id: number, name: string) => void;
}) {
    const hasChildren = category.children.length > 0;
    const indentPx = level * 16; // 16px por nivel

    if (level === 0) {
        // Categoría principal - usa Accordion
        return (
            <AccordionItem value={`item-${category.id}`} className="border rounded-md bg-background/80">
                <AccordionTrigger className="px-4 py-3 hover:no-underline font-medium text-base">
                    {category.name}
                </AccordionTrigger>
                <AccordionContent className="pt-0 border-t bg-background">
                    <div className="p-4 space-y-4">
                        <div className="pl-4 border-l-2 space-y-2">
                            {hasChildren ? (
                                category.children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                                    <CategoryNode
                                        key={child.id}
                                        category={child}
                                        level={1}
                                        onActionComplete={onActionComplete}
                                        onDelete={onDelete}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic py-2">No hay subcategorías.</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <EditCategoryDialog category={category} onActionComplete={onActionComplete} />
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar Padre</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Vas a eliminar la categoría "{category.name}" y todas sus subcategorías. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(category.id, category.name)}>Eliminar Todo</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        );
    }

    // Subcategorías (nivel 1+) - renderizado recursivo
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 -mx-3 rounded-md group hover:bg-accent/50 hover:shadow-sm transition-all duration-150">
                <div className="flex items-center gap-2 flex-1">
                    <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm">{category.name}</span>
                    {hasChildren && (
                        <span className="text-xs text-muted-foreground">({category.children.length})</span>
                    )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditCategoryDialog category={category} onActionComplete={onActionComplete} />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-red-500 hover:text-red-500'>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Vas a eliminar la subcategoría "{category.name}"
                                    {hasChildren && ` y todas sus ${category.children.length} subcategoría(s)`}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(category.id, category.name)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Renderizar hijos recursivamente si existen */}
            {hasChildren && (
                <Accordion type="multiple" className="w-full">
                    <AccordionItem value={`subcat-${category.id}`} className="border-l-2 ml-4 pl-4 border-muted">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                            <div className="flex items-center gap-2">
                                <ChevronRight className="h-3 w-3" />
                                Ver subcategorías ({category.children.length})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                            {category.children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                                <CategoryNode
                                    key={child.id}
                                    category={child}
                                    level={level + 1}
                                    onActionComplete={onActionComplete}
                                    onDelete={onDelete}
                                />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}

// Función recursiva para construir el árbol de categorías
function buildCategoryTree(categories: Category[], parentId: number | null = null): CategoryTreeNode[] {
    return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
            ...cat,
            children: buildCategoryTree(categories, cat.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}


export function CategoriesTab({
    categories,
    categoryDiscounts,
    isLoading,
    onActionComplete
}: {
    categories: Category[];
    categoryDiscounts: CategoryDiscount[];
    isLoading: boolean;
    onActionComplete: () => void;
}) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    const handleAddParentCategory = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const result = await addCategoryAction(formData);
        setIsSubmitting(false);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: "Categoría principal creada." });
            formRef.current?.reset();
            onActionComplete();
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await deleteCategoryAction(id);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: `Categoría "${name}" eliminada.` });
            onActionComplete();
        }
    };

    return (
        <>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Gestionar Categorías</CardTitle>
                <CardDescription>Crea categorías principales y anida subcategorías con múltiples niveles de profundidad.</CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} onSubmit={handleAddParentCategory} className="flex gap-2 mb-6">
                    <Input name="name" placeholder="Nombre de la nueva categoría principal" required disabled={isSubmitting} />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Añadir
                    </Button>
                </form>

                {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <Accordion type="multiple" className="w-full space-y-2" value={openAccordionItems} onValueChange={setOpenAccordionItems}>
                        {categoryTree.map(parent => (
                            <CategoryNode
                                key={parent.id}
                                category={parent}
                                level={0}
                                onActionComplete={onActionComplete}
                                onDelete={handleDelete}
                            />
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>

        <CategoryDiscountsSection
            categoryDiscounts={categoryDiscounts}
            categories={categories}
            isLoading={isLoading}
            onActionComplete={onActionComplete}
        />
    </>
    );
}

// --- Sección de Descuentos por Categoría ---

function getDiscountStatus(d: CategoryDiscount): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
    if (!d.isActive) return { label: 'Inactivo', variant: 'outline' };
    const now = new Date();
    if (new Date(d.endDate) < now) return { label: 'Expirado', variant: 'destructive' };
    if (new Date(d.startDate) > now) return { label: 'Programado', variant: 'secondary' };
    return { label: 'Activo', variant: 'default' };
}

function CategoryDiscountsSection({
    categoryDiscounts,
    categories,
    isLoading,
    onActionComplete,
}: {
    categoryDiscounts: CategoryDiscount[];
    categories: Category[];
    isLoading: boolean;
    onActionComplete: () => void;
}) {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<CategoryDiscount | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({});
    const formId = 'category-discount-form';

    const handleOpenNew = () => {
        setEditingDiscount(undefined);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (d: CategoryDiscount) => {
        setEditingDiscount(d);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (!form) { setIsSubmitting(false); return; }
        const formData = new FormData(form);

        const result = editingDiscount
            ? await updateCategoryDiscountAction(editingDiscount.id, formData)
            : await addCategoryDiscountAction(formData);

        setIsSubmitting(false);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            if ('fieldErrors' in result) setFormErrors(result.fieldErrors as any);
        } else {
            toast({ title: 'Éxito', description: editingDiscount ? 'Descuento actualizado.' : 'Descuento creado.' });
            setIsDialogOpen(false);
            onActionComplete();
        }
    };

    const handleDelete = async (id: number) => {
        const result = await deleteCategoryDiscountAction(id);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Éxito', description: 'Descuento eliminado.' });
            onActionComplete();
        }
    };

    const handleToggle = async (d: CategoryDiscount) => {
        const result = await toggleCategoryDiscountActiveAction(d.id, !d.isActive);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Éxito', description: `Descuento ${!d.isActive ? 'activado' : 'desactivado'}.` });
            onActionComplete();
        }
    };

    return (
        <Card className="shadow-lg mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Descuentos por Categoría</CardTitle>
                    <CardDescription className="mt-1">Aplica descuentos con fecha de vigencia a categorías completas. Se muestran hasta 3 banners en el home.</CardDescription>
                </div>
                <Button onClick={handleOpenNew} className="flex-shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Oferta
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : categoryDiscounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No hay descuentos de categoría configurados.</p>
                ) : (
                    <div className="divide-y rounded-md border">
                        {categoryDiscounts.map(d => {
                            const status = getDiscountStatus(d);
                            return (
                                <div key={d.id} className="flex items-center justify-between p-3 gap-2 hover:bg-accent/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm">{d.categoryName}</span>
                                            <Badge variant="secondary" className="text-xs font-bold text-destructive">{d.discountPercentage}% OFF</Badge>
                                            <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(d.startDate), 'dd/MM/yyyy', { locale: es })} &rarr; {format(new Date(d.endDate), 'dd/MM/yyyy', { locale: es })}
                                        </p>
                                        {d.bannerTitle && (
                                            <p className="text-xs text-muted-foreground italic truncate">"{d.bannerTitle}"</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title={d.isActive ? 'Desactivar' : 'Activar'}
                                            className="h-8 w-8"
                                            onClick={() => handleToggle(d)}
                                        >
                                            {d.isActive
                                                ? <ToggleRight className="h-5 w-5 text-green-500 dark:text-green-400" />
                                                : <ToggleLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                            }
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(d)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar descuento?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Se eliminará el descuento de {d.discountPercentage}% para "{d.categoryName}". Los precios de los productos volverán a la normalidad.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(d.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* Dialog para crear / editar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[480px] grid-rows-[auto_1fr_auto] max-h-[95vh] flex flex-col transition-all duration-300">
                    <DialogHeader>
                        <DialogTitle>{editingDiscount ? 'Editar Descuento de Categoría' : 'Nueva Oferta de Categoría'}</DialogTitle>
                        <DialogDescription>
                            {editingDiscount
                                ? 'Modifica los datos del descuento.'
                                : 'Define el descuento, las fechas y el texto del banner para el home.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto pr-4 -mr-4">
                        <CategoryDiscountForm
                            discount={editingDiscount}
                            formId={formId}
                            errors={formErrors}
                            categories={categories}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingDiscount ? 'Guardar Cambios' : 'Crear Oferta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
