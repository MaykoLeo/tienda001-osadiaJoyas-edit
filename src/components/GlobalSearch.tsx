
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from './ui/button';

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
    <div className="relative w-full max-w-sm">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Input
          type="search"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 w-full rounded-full border-2 border-border focus:border-primary pl-4 pr-10"
          aria-label="Buscar productos"
          autoComplete="off"
        />
        <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
            <Search className="h-4 w-4 text-muted-foreground" />
        </Button>
      </form>
    </div>
  );
}
