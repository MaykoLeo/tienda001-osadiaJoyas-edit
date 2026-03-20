import { Instagram } from "lucide-react";
import Link from 'next/link';
import { useRef } from "react";
import Image from 'next/image';

const mailchimpConfigured = !!process.env.NEXT_PUBLIC_MAILCHIMP_CONFIGURED;


export default function Footer() {
    const navLinks = [
        { href: '/', label: 'Inicio' },
        { href: '/tienda', label: 'Tienda' },
        { href: '/#about', label: 'Sobre Nosotros' },
    ];

  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container py-12 md:py-16 text-foreground">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="space-y-6">
                <Link href="/" className="group block w-fit h-fit outline-none">
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
                <p className="text-sm text-muted-foreground leading-relaxed">&copy; {new Date().getFullYear()} Osadía Joyas. <br/>Arquitectura en cada pieza.</p>
                 <div className="flex gap-5">
                    <Link href="https://www.instagram.com/osadia.cta" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors duration-300"><Instagram className="h-5 w-5"/></Link>
                </div>
            </div>
            
            <div className="space-y-6">
                <h4 className="font-headline font-semibold text-xl tracking-tight uppercase">Navegación</h4>
                <nav className="flex flex-col gap-3">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-widest font-medium">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="space-y-6">
                 <h4 className="font-headline font-semibold text-xl tracking-tight uppercase">Información</h4>
                 <nav className="flex flex-col gap-3">
                    <Link href="/pages/garantia" className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-widest font-medium">Garantía</Link>
                    <Link href="/pages/preguntas-frecuentes" className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-widest font-medium">Preguntas Frecuentes</Link>
                    <Link href="/pages/como-comprar" className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-widest font-medium">Cómo Comprar</Link>
                 </nav>
            </div>
        </div>
      </div>
    </footer>
  );
}
