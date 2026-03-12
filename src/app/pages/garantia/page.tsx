
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ShieldX, Gem, Watch, Heart } from 'lucide-react';

export default function GarantiaPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">Política de Garantía</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tu satisfacción y confianza son nuestra prioridad.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Garantía Joyas */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Gem className="w-8 h-8 text-primary" />
              <span className="text-3xl font-headline">Garantía Joyas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground flex-1">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Cubre Fallas de Fábrica</h3>
                <p>Nuestras joyas tienen garantía por falla o rotura de fábrica. No así por mal uso o cuidado por parte del cliente.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-pink-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Cuidado de las Piezas</h3>
                <p>Las joyas de plata 925 son piezas delicadas y, como todo, necesitan cuidados para aumentar su vida útil.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
                <ShieldX className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-foreground">No nos responsabilizamos por:</h3>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Cortes en cadenas o pulseras finas por mala fuerza (hay que cuidar de no engancharlas).</li>
                        <li>Oscurecimiento de la joya, ya que puede darse por el pH de la piel o la exposición a productos químicos.</li>
                    </ul>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Garantía Relojes */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <Watch className="w-8 h-8 text-primary" />
                <span className="text-3xl font-headline">Garantía Relojes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground flex-1">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Cubre Fallas de Fábrica de Funcionamiento:</h3>
                 <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Si se atrasa, adelanta o deja de funcionar.</li>
                    <li>Falla de software en caso de los Smartwatch.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
       <div className="text-center mt-12">
            <p className="text-lg font-semibold text-muted-foreground">¡Muchas Gracias por tu confianza!</p>
            <p className="text-sm text-muted-foreground">Joya</p>
        </div>
    </div>
  );
}
