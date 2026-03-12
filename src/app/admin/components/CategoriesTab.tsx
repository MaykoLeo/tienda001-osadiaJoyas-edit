"use client";

import { useState, useMemo, useRef } from 'react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { PlusCircle, Trash2, Loader2, Edit, CornerDownRight, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/actions/category-actions';

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


export function CategoriesTab({ categories, isLoading, onActionComplete }: { categories: Category[], isLoading: boolean, onActionComplete: () => void; }) {
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
    );
}
