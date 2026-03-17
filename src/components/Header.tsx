
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
    { href: '/tienda', label: 'Productos' },
    { href: '/#about', label: 'Sobre Nosotros' },
    { href: '/pages/garantia', label: 'Garantía' },
    { href: '/pages/preguntas-frecuentes', label: 'Preguntas Frecuentes' },
    { href: '/pages/como-comprar', label: 'Cómo Comprar' },
  ];

  const isTiendaPage = pathname === '/tienda';

  return (
    <header className={cn(
        // DS Glassmorphism:
        // Light: Champagne Cream translúcido con blur sutil
        // Dark: Carbon rgba(18,18,18,0.7) + blur(10px) — Technological Luxury
        "sticky top-0 z-50 w-full border-b border-border/40",
        "bg-[hsl(40,33%,97%)]/80 backdrop-blur-sm",
        "dark:bg-[rgba(18,18,18,0.7)] dark:backdrop-blur-[10px]",
        "supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300",
        isScrolled ? 'h-16' : 'h-20'
    )}>
      <div className="container flex h-full items-center">
        
        {/* Left Section: Mobile Menu and Search Bar */}
        <div className="flex items-center gap-2 flex-1">
          {/* Mobile Menu - Now visible on all screen sizes */}
          <div>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                  <Menu />
                  <span className="sr-only">Abrir menú</span>
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className='w-full max-w-[300px]'>
                  <SheetHeader>
                      <SheetTitle>
                          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="group block outline-none">
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
                  <nav className="flex flex-col gap-6 p-4 text-lg mt-4">
                      {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">
                          {link.label}
                      </Link>
                      ))}
                  </nav>
              </SheetContent>
              </Sheet>
          </div>
          {!pathname.startsWith('/admin') && (
            <div className={cn("hidden w-full max-w-sm", isTiendaPage ? "lg:block" : "md:block")}>
              <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                <GlobalSearch />
              </Suspense>
            </div>
          )}
        </div>

        {/* Center Section: Logo */}
        <div className="flex-1 flex justify-center">
             <Link href="/" className="group flex items-center space-x-2 outline-none">
                <div 
                  className="w-[140px] h-[50px] bg-foreground group-hover:bg-primary transition-colors duration-300"
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

        {/* Right Section: Icons */}
        <div className="flex items-center justify-end space-x-1 flex-1">
          <ThemeToggle />
          {!pathname.startsWith('/admin') && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} aria-label="Carrito de compras">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </div>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
