/*
'use server';

import { z } from "zod";
import DOMPurify from 'isomorphic-dompurify';
import { addOrUpdateSubscriber } from "@/lib/subscribers";

// Helper function to sanitize form data
function sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitizedData: Record<string, any> = {};
    for (const key in data) {
        if (typeof data[key] === 'string') {
            sanitizedData[key] = DOMPurify.sanitize(data[key]);
        } else {
            sanitizedData[key] = data[key];
        }
    }
    return sanitizedData;
}

const subscriberSchema = z.object({
  email: z.string().email("El email no es válido."),
  // Opcional: podrías añadir más validaciones si tu formulario las requiere
});

export async function addSubscriberAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const sanitizedData = sanitizeData(rawData);

  const validatedFields = subscriberSchema.safeParse(sanitizedData);

  if (!validatedFields.success) {
    return {
      success: false,
      // Unimos los errores en un solo string para mostrarlos
      message: validatedFields.error.issues.map((issue) => issue.message).join(', '),
    };
  }

  // La función importada se llamaba addOrUpdateSubscriber
  // y espera un objeto con la propiedad email
  return await addOrUpdateSubscriber({ email: validatedFields.data.email });
}
*/
