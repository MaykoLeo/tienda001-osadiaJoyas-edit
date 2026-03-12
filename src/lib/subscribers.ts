/*
'use server';

import mailchimp from "@mailchimp/mailchimp_marketing";
import type { Subscriber } from './types';

// Configuración de Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

const listId = process.env.MAILCHIMP_AUDIENCE_ID!;

// Función para añadir o actualizar un suscriptor
export async function addOrUpdateSubscriber(subscriber: Subscriber): Promise<{ success: boolean; message: string }> {
  if (!listId) {
    console.error('Mailchimp Audience ID no está configurado en las variables de entorno.');
    return { success: false, message: 'La configuración para la suscripción no está completa.' };
  }

  try {
    await mailchimp.lists.setListMember(listId, subscriber.email.toLowerCase(), {
      email_address: subscriber.email,
      status_if_new: "subscribed",
      merge_fields: {
        FNAME: subscriber.firstName,
        LNAME: subscriber.lastName,
      },
    });
    return { success: true, message: '¡Te has suscrito con éxito!' };
  } catch (error: any) {
    console.error('Error al suscribir a Mailchimp:', error.response?.body || error.message);
    // Devuelve un mensaje más amigable al usuario
    if (error.status === 400) {
        return { success: false, message: 'La dirección de correo electrónico no es válida.' };
    }
    return { success: false, message: 'Hubo un problema al procesar tu suscripción. Inténtalo más tarde.' };
  }
}
*/
