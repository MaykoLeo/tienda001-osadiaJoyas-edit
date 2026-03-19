
"use client";

import Link from 'next/link';
import { ShoppingCart, Menu } from 'lucide-react';
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
        setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/tienda', label: 'Tienda' },
    { href: '/#about', label: 'Sobre Nosotros' },
    { href: '/pages/garantia', label: 'Garantía' },
    { href: 'https://wa.me/your-number', label: 'Contacto' },
    { href: '/pages/preguntas-frecuentes', label: 'FAQ' },
    { href: '/pages/como-comprar', label: 'Cómo Comprar' },
  ];

  const isTiendaPage = pathname === '/tienda';

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "translate-y-0" : "translate-y-0"
    )}>
      {/* Informative Address Bar with Blur */}
      <div className="w-full bg-background/60 backdrop-blur-md border-b border-border/10 py-1.5 hidden sm:block">
          <div className="container flex justify-center items-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 font-medium">
                  La Rioja 416, Catamarca, Argentina
              </p>
          </div>
      </div>

      <div className={cn(
        // DS Glassmorphism:
        "w-full border-b border-border/40 transition-all duration-300",
        "bg-[hsl(40,33%,97%)]/90 backdrop-blur-md",
        "dark:bg-[rgba(15,15,15,0.8)] dark:backdrop-blur-[12px]",
        isScrolled ? 'h-16' : 'h-24'
      )}>
        <div className="container h-full flex items-center gap-4">
          
          {/* LEFT: Navigation Links - Now including "Garantía" */}
          <nav className="flex-1 hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.slice(0, 4).map((link) => (
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
          </nav>

          {/* LEFT: Mobile Menu Button (Visible on md and smaller) */}
          <div className="lg:hidden flex items-center gap-2 flex-1">
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
                <nav className="flex flex-col gap-8 text-xs font-headline uppercase tracking-[0.2em]">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                          "transition-colors hover:text-primary py-2 border-b border-border/20",
                           pathname === link.href ? "text-primary" : "text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* CENTER: Logo */}
          <div className="flex-shrink-0 flex justify-center px-4">
              <Link href="/" className="group flex items-center outline-none transition-transform hover:scale-105 duration-300">
                <div 
                  className={cn(
                      "transition-all duration-300 bg-foreground group-hover:bg-primary",
                      isScrolled ? "w-[120px] h-[45px]" : "w-[150px] h-[55px]"
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

          {/* RIGHT: Navigation + Search + Icons */}
          <div className="flex-1 flex items-center justify-end gap-4 lg:gap-8">
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.slice(4, 5).map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={cn(
                    "text-[13px] uppercase tracking-[0.2em] font-headline transition-all hover:text-primary relative group",
                     pathname === link.href ? "text-primary" : "text-foreground/80"
                  )}
                  target={link.href.startsWith('http') ? "_blank" : undefined}
                >
                  {link.label}
                  <span className={cn(
                      "absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full",
                      pathname === link.href && "w-full"
                  )} />
                </Link>
              ))}
            </nav>

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
