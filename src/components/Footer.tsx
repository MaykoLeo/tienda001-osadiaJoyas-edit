
"use client";

import { Instagram, Facebook, Send } from "lucide-react";
import Link from 'next/link';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
// import { addSubscriberAction } from "@/app/actions/subscriber-actions"; // <--- ACCIÓN DESACTIVADA
import { useRef } from "react";
import Image from 'next/image';

const mailchimpConfigured = !!process.env.NEXT_PUBLIC_MAILCHIMP_CONFIGURED;

function NewsletterForm() {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // const formData = new FormData(event.currentTarget);
        // const result = await addSubscriberAction(formData); // <--- LLAMADA A LA ACCIÓN DESACTIVADA

        // Mensaje temporal mientras la función está desactivada
        toast({
            title: "Función no disponible",
            description: "La suscripción al boletín no está activa en este momento.",
        });

        /* CÓDIGO ORIGINAL GUARDADO PARA FUTURA REACTIVACIÓN
        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "¡Éxito!",
                description: result.message,
            });
            formRef.current?.reset();
        }
        */
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
            <Input 
                type="email" 
                name="email" 
                placeholder="tu@email.com" 
                className="bg-background" 
                required 
                disabled={!mailchimpConfigured} 
            />
            <Button type="submit" size="icon" disabled={!mailchimpConfigured}><Send/></Button>
        </form>
    );
}


export default function Footer() {
    const navLinks = [
        { href: '/', label: 'Inicio' },
        { href: '/tienda', label: 'Tienda' },
        { href: '/#about', label: 'Sobre Nosotros' },
    ];

  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container py-12 md:py-16 text-foreground">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-6 md:col-span-1">
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
                    <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors duration-300"><Facebook className="h-5 w-5"/></Link>
                </div>
            </div>
            
            <div className="space-y-6">
                <h4 className="font-headline font-semibold text-xl tracking-tight">Navegación</h4>
                <nav className="flex flex-col gap-3">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-wider font-medium">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="space-y-6">
                 <h4 className="font-headline font-semibold text-xl tracking-tight">Información</h4>
                 <nav className="flex flex-col gap-3">
                    <Link href="/pages/garantia" className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-wider font-medium">Garantía</Link>
                    <Link href="/pages/preguntas-frecuentes" className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-wider font-medium">Preguntas Frecuentes</Link>
                    <Link href="/pages/como-comprar" className="text-muted-foreground hover:text-primary transition-colors duration-300 w-fit text-sm uppercase tracking-wider font-medium">Cómo Comprar</Link>
                 </nav>
            </div>
            
            <div className="space-y-6">
                <h4 className="font-headline font-semibold text-xl tracking-tight">Newsletter</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {mailchimpConfigured 
                        ? "Sé el primero en conocer nuestras nuevas colecciones y eventos exclusivos."
                        : "Suscripción temporalmente fuera de servicio."
                    }
                </p>
                <NewsletterForm />
            </div>
        </div>
      </div>
    </footer>
  );
}
