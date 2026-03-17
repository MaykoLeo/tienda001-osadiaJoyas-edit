
import { Truck, ShieldCheck, MessageSquareQuote } from 'lucide-react';

const whyChooseUsFeatures = [
    {
        icon: Truck,
        title: "Envíos a Todo el País",
        description: "Recibe tus joyas en la comodidad de tu hogar, sin importar dónde te encuentres.",
        bgColor: "bg-blue-100/50 dark:bg-blue-900/20",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
        icon: ShieldCheck,
        title: "Garantía de Calidad",
        description: "Cada pieza está elaborada con materiales de primera y un cuidado excepcional.",
        bgColor: "bg-green-100/50 dark:bg-green-900/20",
        iconColor: "text-green-600 dark:text-green-400"
    },
    {
        icon: MessageSquareQuote,
        title: "Asesoramiento Personalizado",
        description: "Te ayudamos a encontrar la joya perfecta que exprese tu estilo único.",
        bgColor: "bg-yellow-100/50 dark:bg-yellow-900/20",
        iconColor: "text-yellow-600 dark:text-yellow-400"
    }
];

export function WhyChooseUs() {
    return (
        <section id="why-choose-us" className="space-y-12 py-5">
            <div className="text-center space-y-3">
                <span className="text-primary uppercase tracking-[0.4em] text-[10px] font-headline font-bold">
                    Experiencia Osadía
                </span>
                <h2 className="text-5xl font-headline font-bold">¿Por Qué Elegirnos?</h2>
                <p className="mt-4 text-muted-foreground/80 max-w-2xl mx-auto font-body">
                    Creemos que una joya es más que un accesorio, es una declaración. Por eso, te ofrecemos una experiencia de compra única.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {whyChooseUsFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <div key={index} className={`p-8 rounded-2xl text-center space-y-4 ${feature.bgColor}`}>
                            <div className="inline-block p-4 bg-background rounded-full shadow-md">
                                <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                            </div>
                            <h3 className="text-2xl font-bold font-headline">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
