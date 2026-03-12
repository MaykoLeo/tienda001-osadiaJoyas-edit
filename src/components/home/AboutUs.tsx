
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import Link from 'next/link';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

export function AboutUs() {
    return (
        <section id="about" className="grid md:grid-cols-3 gap-12 items-center py-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                    <iframe
                    src="https://maps.google.com/maps?q=La%20Rioja%20416,%20Catamarca,%20Argentina&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación de la tienda"
                    className='grayscale hover:grayscale-0 transition-all duration-500'
                ></iframe>
            </div>
            <div className='space-y-6 md:col-span-2'>
                <h2 className="text-4xl font-headline font-bold">Sobre Nosotros</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                    En Osadía entendemos la joyería como un lenguaje visual que transmite identidad y estilo. Nuestra marca nace de la unión entre diseño contemporáneo y una mirada minimalista, creando piezas que equilibran simplicidad, precisión y una fuerte carga simbólica.
                </p>
                <p className="text-muted-foreground leading-relaxed text-lg">
                    Trabajamos con materiales de alta calidad para lograr joyas versátiles y modernas. Cada pieza está pensada para acompañar distintos momentos y proyectar una identidad clara y elegante. En Osadía, cada diseño inspira y perdura.
                </p>
                <div className='flex flex-wrap gap-4 pt-4'>
                        <Button asChild className="shadow-md" size="lg">
                        <Link href="https://www.instagram.com/osadia.cta" target="_blank" rel="noopener noreferrer">
                            <InstagramIcon className="w-6 h-6 mr-2" /> Síguenos en Instagram
                        </Link>
                    </Button>
                        <Button asChild variant="outline" className="shadow-md" size="lg">
                        <Link href="/tienda">
                            <Gem className="mr-2" /> Nuestros Productos
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
