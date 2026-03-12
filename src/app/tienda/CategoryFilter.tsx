
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { type Category } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

// --- Helper Functions ---
interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const categoryMap = new Map<number, CategoryNode>();
  const rootCategories: CategoryNode[] = [];

  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  categories.forEach(category => {
    const node = categoryMap.get(category.id);
    if (node) {
      if (category.parentId) {
        const parentNode = categoryMap.get(category.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    }
  });

  const sortChildren = (node: CategoryNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  }
  rootCategories.sort((a, b) => a.name.localeCompare(b.name));
  rootCategories.forEach(sortChildren);

  return rootCategories;
}

// --- Sub-components ---

function CollapsibleCategoryLink({ category, currentCategoryId, level }: { category: CategoryNode; currentCategoryId: string | null; level: number }) {
  const hasChildren = category.children.length > 0;

  const isBranchActive = (catNode: CategoryNode): boolean => {
    if (String(catNode.id) === currentCategoryId) return true;
    return catNode.children.some(isBranchActive);
  };

  const [isOpen, setIsOpen] = useState(() => isBranchActive(category));

  useEffect(() => {
    if (isBranchActive(category)) {
      setIsOpen(true);
    }
  }, [currentCategoryId, category]);

  if (hasChildren) {
    const branchIsActive = isBranchActive(category);
    return (
      <div className="py-1" style={{ paddingLeft: `${level > 0 ? (level * 0.75) : 0}rem` }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center w-full text-left text-sm font-semibold transition-colors rounded-md px-2 py-1.5 ${
            branchIsActive
              ? 'text-primary bg-primary/20' 
              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
          }`}>
          {isOpen ? <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />}
          <span>{category.name}</span>
        </button>
        {isOpen && (
          <div className="mt-1">
            {category.children.map(child => (
              <CollapsibleCategoryLink
                key={child.id}
                category={child}
                currentCategoryId={currentCategoryId}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.set('page', '1');
  params.set('category', String(category.id));
  const href = `/tienda?${params.toString()}#productos-grid`;
  const isActive = currentCategoryId === String(category.id);

  return (
    <div style={{ paddingLeft: `${level > 0 ? (level * 0.75) : 0}rem` }}>
      <Link
        href={href}
        className={`flex items-center w-full text-left text-sm transition-colors rounded-md px-2 py-1.5 ${
            isActive
                ? 'font-semibold text-primary bg-primary/20'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        }`}>
        <ChevronRight className="h-4 w-4 mr-2 text-transparent flex-shrink-0" />
        <span>{category.name}</span>
      </Link>
    </div>
  );
}

// --- Main Component ---

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get('category');
  const categoryTree = buildCategoryTree(categories);

  const allProductsParams = new URLSearchParams(searchParams.toString());
  allProductsParams.delete('category');
  allProductsParams.set('page', '1');
  const allProductsHref = `/tienda?${allProductsParams.toString()}#productos-grid`;
  const isAllProductsActive = !currentCategoryId;

  return (
    <div className="w-full">
      <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
        <Link
          href={allProductsHref}
          className={`block w-full text-left text-sm transition-colors rounded-md px-3 py-2 my-1 font-semibold ${
            isAllProductsActive 
              ? 'text-primary bg-primary/20' 
              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
          }`}>
          Todos los Productos
        </Link>
        
        {categoryTree.map(category => (
          <CollapsibleCategoryLink 
            key={category.id} 
            category={category} 
            currentCategoryId={currentCategoryId} 
            level={0} 
          />
        ))}
      </div>
    </div>
  );
}
