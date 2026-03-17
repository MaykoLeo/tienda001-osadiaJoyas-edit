
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Update search term if URL query changes
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newQuery = searchTerm.trim();
    const currentQuery = new URLSearchParams(searchParams.toString());

    if (newQuery) {
      currentQuery.set('q', newQuery);
    } else {
      currentQuery.delete('q');
    }

    // Always reset to the first page on a new search
    currentQuery.delete('page'); 

    const search = currentQuery.toString();
    const query = search ? `?${search}` : '';

    router.push(`/tienda${query}#products-grid`);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearchSubmit} className="relative group">
        <Input
          type="search"
          placeholder="Buscar piezas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
              "h-9 w-full rounded-full border border-border/40 bg-muted/20 pl-4 pr-10 text-xs transition-all",
              "focus-visible:ring-1 focus-visible:ring-primary/30 focus:bg-background focus:border-primary/50",
              "placeholder:text-muted-foreground/50 font-body"
          )}
          aria-label="Buscar productos"
          autoComplete="off"
        />
        <Button 
          type="submit" 
          size="icon" 
          variant="ghost" 
          className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-transparent group-hover:text-primary transition-colors"
        >
            <Search className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
        </Button>
      </form>
    </div>
  );
}
