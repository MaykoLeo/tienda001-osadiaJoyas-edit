
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Truck, CreditCard, CheckCircle, Search } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: Search,
    title: '1. Explora y Elige tus Productos',
    description:
      'Navega por nuestra <a href="/tienda" class="text-primary hover:underline">tienda</a> y descubre todo lo que tenemos para ofrecerte. Cuando encuentres algo que te guste, simplemente haz clic en el botón "Añadir al Carrito" para guardarlo en tu compra.',
  },
  {
    icon: ShoppingCart,
    title: '2. Revisa tu Carrito',
    description:
      'Una vez que hayas añadido un producto, aparecerá un panel lateral con tu carrito. También puedes acceder a él haciendo clic en el ícono del carrito en la esquina superior derecha. Aquí podrás revisar tus productos, ajustar las cantidades o aplicar un código de descuento si tienes uno.',
  },
  {
    icon: Truck,
    title: '3. Procede al Pago y Completa tus Datos',
    description:
      'Cuando estés listo, haz clic en "Iniciar Compra". Te llevaremos a nuestra página de pago seguro. El primer paso es completar tu información de contacto y la dirección de envío para que sepamos a dónde enviar tu pedido.',
  },
  {
    icon: CreditCard,
    title: '4. Elige tu Método de Pago',
    description:
      'Después de ingresar tus datos de envío, se habilitará la sección de pago. Procesamos todas nuestras transacciones de forma segura a través de <strong>Mercado Pago</strong>. Podrás pagar con tarjeta de crédito, débito o directamente con el saldo de tu cuenta de Mercado Pago.',
  },
  {
    icon: CheckCircle,
    title: '5. ¡Listo! Confirmación y Seguimiento',
    description:
      'Una vez que el pago sea aprobado, ¡tu compra estará completa! Recibirás una confirmación y pronto nos pondremos en contacto para coordinar el envío. ¡Gracias por confiar en nosotros!',
  },
];

export default function ComoComprarPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">¿Cómo Comprar?</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Sigue estos simples pasos para realizar tu compra de forma fácil y segura.
        </p>
      </div>

      <div className="space-y-8">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full w-16 h-16 flex-shrink-0">
              <step.icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-headline">{step.title}</h2>
              <p
                className="mt-2 text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: step.description }}
              ></p>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-12" />

      <Card className="text-center bg-secondary/50">
        <CardHeader>
          <CardTitle>¿Tienes más preguntas?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Si todavía tienes dudas, no dudes en visitar nuestra sección de{' '}
            <Link href="/pages/preguntas-frecuentes" className="text-primary hover:underline font-semibold">
              Preguntas Frecuentes
            </Link>{' '}
            o contactarnos directamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
