import { NextResponse, NextRequest } from 'next/server';

// Código postal de origen del negocio (Catamarca Capital)
const ORIGIN_POSTAL_CODE = 'K4700HDL';

// Dimensiones y peso por defecto para los paquetes de la joyería.
// Representa un empaque estándar con protección (caja + relleno + sobre acolchado).
// Peso: 500g | Medidas: 20 × 15 × 5 cm
const DEFAULT_DIMENSIONS = {
    weight: 500, // gramos
    height: 5,   // cm
    width: 15,   // cm
    length: 20,  // cm
};

async function getAuthToken(apiUrl: string, user: string, pass: string): Promise<string | null> {
    try {
        const credentials = Buffer.from(`${user}:${pass}`).toString('base64');
        const response = await fetch(`${apiUrl}/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
            },
        });

        if (!response.ok) {
            console.error('[Shipping] Error de autenticación con Correo Argentino:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('[Shipping] Excepción al obtener el token de Correo Argentino:', error);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const { postalCodeDestination } = await req.json();

    if (!postalCodeDestination) {
        return NextResponse.json({ error: 'El código postal de destino es requerido' }, { status: 400 });
    }

    const {
        CORREO_API_BASE_URL: apiUrl,
        CORREO_API_USER: apiUser,
        CORREO_API_PASS: apiPass,
        CORREO_CUSTOMER_ID: customerId,
    } = process.env;

    if (!apiUrl || !apiUser || !apiPass || !customerId) {
        console.error('[Shipping] Faltan variables de entorno de la API de Correo Argentino.');
        return NextResponse.json({ error: 'El servicio de cálculo de envío no está configurado.' }, { status: 500 });
    }

    console.log(`[Shipping] Solicitando cotización para CP destino: ${postalCodeDestination}`);

    const token = await getAuthToken(apiUrl, apiUser, apiPass);

    if (!token) {
        return NextResponse.json({ error: 'No se pudo autenticar con el servicio de envíos.' }, { status: 500 });
    }

    try {
        const rateRequestBody = {
            customerId,
            postalCodeOrigin: ORIGIN_POSTAL_CODE,
            postalCodeDestination,
            deliveredType: 'D', // Entrega a domicilio
            dimensions: DEFAULT_DIMENSIONS,
        };

        console.log('[Shipping] Request body:', JSON.stringify(rateRequestBody));

        const response = await fetch(`${apiUrl}/rates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(rateRequestBody),
        });

        const responseText = await response.text();
        console.log(`[Shipping] HTTP ${response.status} Respuesta raw:`, responseText);

        if (!response.ok) {
            console.error('[Shipping] Error HTTP al cotizar el envío:', response.status, responseText);
            return NextResponse.json({ error: `No se pudo calcular el costo de envío. (${response.status})` }, { status: response.status });
        }

        // Parsear el texto ya leído
        let data: { rates?: { deliveredType: string; price: number; productName: string; deliveryTimeMin: string; deliveryTimeMax: string }[]; code?: string; message?: string };
        try {
            data = JSON.parse(responseText);
        } catch {
            console.error('[Shipping] Respuesta no es JSON válido:', responseText);
            return NextResponse.json({ error: 'Respuesta inesperada del servicio de envíos.' }, { status: 502 });
        }

        // Correo a veces devuelve HTTP 200 con body de error { code, message }
        if (data.code && data.message && !data.rates) {
            console.error(`[Shipping] Error de la API (HTTP 200 con error): código=${data.code} mensaje=${data.message}`);
            return NextResponse.json({ error: data.message }, { status: 422 });
        }

        const shippingRate = data.rates?.find(rate => rate.deliveredType === 'D');

        if (!shippingRate || typeof shippingRate.price !== 'number') {
            console.error('[Shipping] No se encontró tarifa D en la respuesta:', JSON.stringify(data));
            return NextResponse.json({ error: 'No se encontró una tarifa de envío para el código postal ingresado.' }, { status: 404 });
        }

        console.log(`[Shipping] Costo de envío obtenido: $${shippingRate.price} (${shippingRate.productName})`);

        return NextResponse.json({
            shippingCost: shippingRate.price,
            productName: shippingRate.productName,
            deliveryTimeMin: shippingRate.deliveryTimeMin,
            deliveryTimeMax: shippingRate.deliveryTimeMax,
        });

    } catch (error) {
        console.error('[Shipping] Excepción al calcular la tarifa:', error);
        return NextResponse.json({ error: 'Ocurrió un error inesperado al calcular el envío.' }, { status: 500 });
    }
}
