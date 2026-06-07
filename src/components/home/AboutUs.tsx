
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import Link from 'next/link';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import Image from 'next/image';

export function AboutUs() {
    return (
        <section id="about" className="grid md:grid-cols-5 gap-10 items-center py-10">
            <div className="md:col-span-2 relative p-[2px] border border-primary/30 dark:border-white/10 rounded-[18px] group">
                <div className="relative aspect-[2/3] max-h-[440px] w-full rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                        src="/Captura5.JPG"
                        alt="Esencia Osadía"
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:opacity-0 transition-opacity duration-700" />
                </div>
            </div>

            <div className='md:col-span-3 space-y-8'>
                <div className="space-y-3">
                    <span className="text-accent uppercase tracking-[0.4em] text-[13px] font-headline font-bold block">
                        Sobre Nosotros
                    </span>
                    <h2 className="text-5xl font-headline font-bold leading-[1.1]">
                        Nuestra Esencia
                    </h2>
                </div>

                <div className="space-y-6 text-muted-foreground/90 leading-relaxed text-lg font-body">
                    <p>
                        En Osadía entendemos la joyería como un lenguaje visual que transmite identidad y estilo. Nuestra marca nace de la unión entre diseño contemporáneo y una mirada minimalista, creando piezas que equilibran simplicidad, precisión y una fuerte carga simbólica.
                    </p>
                    <p>
                        Trabajamos con materiales de alta calidad para lograr joyas versátiles y modernas. Cada pieza está pensada para acompañar distintos momentos y proyectar una identidad clara y elegante. En Osadía, cada diseño inspira y perdura.
                    </p>
                </div>
                <div className='flex flex-wrap gap-4 pt-4'>
                    <Button asChild className="rounded-full px-8 py-6 text-xs uppercase tracking-widest font-bold shadow-gold/20 shadow-lg hover:shadow-xl transition-all" size="lg">
                        <Link href="https://www.instagram.com/osadia.cta" target="_blank" rel="noopener noreferrer">
                            <InstagramIcon className="w-4 h-4 mr-3" /> Síguenos en Instagram
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-8 py-6 text-xs uppercase tracking-widest font-bold hover:bg-accent/10 hover:text-accent hover:border-accent transition-all border-primary/20" size="lg">
                        <Link href="/tienda">
                            <Gem className="w-4 h-4 mr-3" /> Nuestros Productos
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
