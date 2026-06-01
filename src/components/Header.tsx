
"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, ChevronDown } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { GlobalSearch } from './GlobalSearch';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const { cartCount, setIsSidebarOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 80) {
        setIsScrolled(true);
      } else if (currentScrollY < 20) {
        setIsScrolled(false);
      }
    };

    // Run once initially to set correct state in case page is loaded scrolled
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/tienda', label: 'Tienda' },
  ];

  const infoLinks = [
    { href: '/pages/garantia', label: 'Garantía' },
    { href: '/pages/preguntas-frecuentes', label: 'Preguntas Frecuentes' },
    { href: '/pages/como-comprar', label: 'Cómo Comprar' },
    { href: '/#about', label: 'Sobre Nosotros' },
  ];

  const isTiendaPage = pathname === '/tienda';

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full h-24 sm:h-[124px] transition-all duration-300"
    )}>
      {/* Informative Address Bar with Blur */}
      <div className="w-full bg-background/60 backdrop-blur-md border-b border-border/10 py-1.5 hidden sm:block">
          <div className="container flex justify-center items-center text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 font-medium">
                  La Rioja 416, Catamarca, Argentina
              </p>
          </div>
      </div>

      <div className={cn(
        // DS Glassmorphism:
        "w-full border-b border-border/40 transition-[height,background-color,border-color,box-shadow] duration-300 ease-in-out absolute top-0 sm:top-[28px] left-0",
        "bg-[hsl(var(--header-bg))]/90 backdrop-blur-md",
        isScrolled ? 'h-16 shadow-md border-border/60' : 'h-24 border-border/40'
      )}>
        <div className="container h-full flex items-center justify-between relative">
          
          {/* LEFT: Navigation Links */}
          <nav className="flex-1 hidden lg:flex items-center gap-6 xl:gap-8 justify-start">
            {mainLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "text-[13px] uppercase tracking-[0.2em] font-headline transition-all hover:text-primary relative group",
                   pathname === link.href ? "text-primary" : "text-foreground/80"
                )}
              >
                {link.label}
                <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full",
                    pathname === link.href && "w-full"
                )} />
              </Link>
            ))}

            {/* Dropdown de Información */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[13px] uppercase tracking-[0.2em] font-headline transition-all hover:text-primary relative group flex items-center gap-1 text-foreground/80 outline-none">
                  Información
                  <ChevronDown className="h-3 w-3" />
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px] bg-background/80 backdrop-blur-md border-primary/10 border-t-0 p-0 overflow-hidden shadow-xl">
                {/* Soft top gradient instead of border */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                
                <div className="py-2">
                    {infoLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild className="focus:bg-primary/5 focus:text-primary cursor-pointer px-4">
                        <Link 
                        href={link.href} 
                        className="text-[11px] uppercase tracking-[0.15em] font-headline w-full py-2.5 transition-colors"
                        >
                        {link.label}
                        </Link>
                    </DropdownMenuItem>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* LEFT: Mobile Menu Button (Visible on md and smaller) */}
          <div className="lg:hidden flex items-center flex-1">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-primary/20 transition-all duration-300">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className='w-full max-w-[300px] border-r-primary/20 bg-background/95 backdrop-blur-md'>
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-left">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="group inline-block outline-none">
                      <div 
                        className="w-[120px] h-[40px] bg-foreground group-hover:bg-primary transition-colors duration-300"
                        style={{
                          maskImage: 'url(https://i.imgur.com/iYTQ6pp.png)',
                          WebkitMaskImage: 'url(https://i.imgur.com/iYTQ6pp.png)',
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat'
                        }}
                        role="img"
                        aria-label="OSADÍA Logo"
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 text-xs font-headline uppercase tracking-[0.2em]">
                  <p className="text-[10px] text-muted-foreground/60 border-b border-border/40 pb-2">Menú Principal</p>
                  {mainLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                          "transition-colors hover:text-primary py-1",
                           pathname === link.href ? "text-primary font-bold" : "text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <p className="text-[10px] text-muted-foreground/60 border-b border-border/40 pb-2 mt-4">Información</p>
                  {infoLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                          "transition-colors hover:text-primary py-1",
                           pathname === link.href ? "text-primary font-bold" : "text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* CENTER: Logo con Centrado Absoluto Matemático */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center z-10 pointer-events-none">
              <Link href="/" className="group flex items-center outline-none transition-transform hover:scale-105 duration-300 pointer-events-auto">
                <div 
                  className={cn(
                      "transition-all duration-300 bg-foreground group-hover:bg-primary",
                      isScrolled ? "w-[110px] h-[40px]" : "w-[140px] h-[52px]"
                  )}
                  style={{
                    maskImage: 'url(https://i.imgur.com/iYTQ6pp.png)',
                    WebkitMaskImage: 'url(https://i.imgur.com/iYTQ6pp.png)',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat'
                  }}
                  role="img"
                  aria-label="OSADÍA Logo"
                />
              </Link>
          </div>

          {/* RIGHT: Search + Theme + Cart */}
          <div className="flex-1 flex items-center justify-end gap-2 lg:gap-4">
            {!pathname.startsWith('/admin') && (
              <div className="hidden md:block w-full max-w-[140px] lg:max-w-[200px]">
                <Suspense fallback={<div className="h-9 w-full bg-muted/20 animate-pulse rounded-full" />}>
                  <GlobalSearch />
                </Suspense>
              </div>
            )}
            
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              
              {!pathname.startsWith('/admin') && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="relative hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-primary/20 transition-all duration-300"
                  aria-label="Carrito de compras"
                >
                  <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
                      {cartCount}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
