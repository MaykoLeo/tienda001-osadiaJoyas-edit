
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';
import Link from 'next/link';

const faqs = [
    {
        question: "¿Qué métodos de pago aceptan?",
        answer: "Aceptamos todos los principales métodos de pago a través de Mercado Pago, incluyendo tarjetas de crédito, tarjetas de débito y el saldo disponible en tu cuenta de Mercado Pago. ¡Es rápido, fácil y 100% seguro!"
    },
    {
        question: "¿Cuál es el costo de envío?",
        answer: "El costo y método de envío se coordinan directamente contigo después de que se confirma la compra para asegurar la mejor opción para tu ubicación. Una vez que completes tu pedido, nos pondremos en contacto para gestionar la entrega."
    },
    {
        question: "¿Cuánto tiempo tarda en llegar mi pedido?",
        answer: "El tiempo de entrega dependerá del método de envío que coordinemos. Hacemos todo lo posible para despachar los pedidos rápidamente y te mantendremos informado sobre el estado de tu envío en todo momento."
    },
    {
        question: "¿Puedo realizar un seguimiento de mi pedido?",
        answer: "¡Claro que sí! Una vez que tu pedido sea despachado, te proporcionaremos la información necesaria para que puedas seguir su recorrido hasta que llegue a tus manos."
    },
    {
        question: "¿Cuál es la política de devoluciones?",
        answer: 'Nuestra prioridad es tu satisfacción. Para obtener información detallada sobre nuestra política de devoluciones y cambios, por favor visita nuestra página de <a href="/pages/garantia" class="text-primary hover:underline">Garantía</a>.'
    },
     {
        question: "¿Tienen una tienda física?",
        answer: 'Actualmente operamos de forma 100% online, lo que nos permite ofrecerte los mejores precios. Sin embargo, ofrecemos la opción de retirar tu compra personalmente en nuestro punto de despacho en Buenos Aires.'
    },
]


export default function PreguntasFrecuentesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">Preguntas Frecuentes</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Encuentra aquí las respuestas a las dudas más comunes.
        </p>
      </div>

        <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                 <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                        <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        <Card className="text-center mt-12 bg-secondary/50">
            <CardHeader>
                <CardTitle>¿No encontraste lo que buscabas?</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    No te preocupes, estamos aquí para ayudarte. Contáctanos directamente a través de nuestro <Link href="https://wa.me/5491122334455" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">WhatsApp</Link> y resolveremos tus dudas.
                </p>
            </CardContent>
        </Card>

    </div>
  );
}
