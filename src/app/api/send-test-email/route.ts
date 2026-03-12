
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Osadia Joyas <onboarding@resend.dev>',
      to: ['maykoleo90@gmail.com'],
      subject: 'Prueba de correo desde Osadia Joyas',
      html: '<h1>¡Felicidades!</h1><p>Si esta llamada a la API funciona, tu configuración de Resend está funcionando correctamente.</p>'
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: '¡Correo de prueba enviado exitosamente! (Revisa tu bandeja de entrada si usaste tu email)',
      data
    });

  } catch (exception) {
    console.error('Catch Exception:', exception);
    if (exception instanceof Error) {
        return NextResponse.json({ error: exception.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
  }
}
