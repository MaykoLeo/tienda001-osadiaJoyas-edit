
import { OrderItem } from '@/lib/types';
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Hr, 
  Html, 
  Img, 
  Preview, 
  Section, 
  Text,
  Row,
  Column
} from '@react-email/components';
import * as React from 'react';

interface ConfirmationEmailProps {
  customerName: string;
  orderId: string;
  totalAmount: number;
  orderItems: OrderItem[];
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// --- Función para formatear precios ---
const formatPrice = (amount: number) => {
  // Usamos el locale 'de-DE' que formatea los números como 1.234,56
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'USD', // Puedes cambiarlo a tu moneda si es necesario
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Reemplazamos el símbolo de la moneda si es necesario, o lo dejamos
  // En este caso, lo dejamos como está, ya que Intl.NumberFormat es bastante bueno.
  // Si se quisiera un formato exacto como "$ 1.234,56", se necesitarían más ajustes.
  // Por ahora, el formato será "1.234,56 $" que es claro y correcto.
  return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


export const ConfirmationEmail: React.FC<Readonly<ConfirmationEmailProps>> = ({ 
  customerName,
  orderId,
  totalAmount,
  orderItems,
}) => {

  // --- Cálculos de totales ---
  const subtotal = orderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);
  const discount = subtotal - totalAmount;

  return (
    <Html>
      <Head />
      <Preview>Confirmación de tu pedido en Osadía Joyas</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}/osadia-logo-completo.jpg`}
              width="200" // Ajustado para un logo más rectangular
              height="55"
              alt="Osadía Joyas Logo"
            />
          </Section>
          <Heading style={h1}>¡Gracias por tu compra, {customerName}!</Heading>
          <Text style={paragraph}>
            Hemos recibido la confirmación de tu pago para el pedido <strong>#{orderId}</strong>. 
            Ya estamos preparando todo para que lo recibas lo antes posible. 
            Cualquier consulta no dudes en escribirnos a nuestro Whatsapp.
          </Text>
          
          <Hr style={hr} />

          <Heading style={h2}>Resumen de tu compra</Heading>
          
          {orderItems.map((item) => (
            <Section key={item.productId} style={itemSection}>
              <Row>
                <Column style={{ width: '80px' }}>
                  <Img 
                    src={item.image} 
                    alt={item.name} 
                    width="70" 
                    height="70" 
                    style={productImage}
                  />
                </Column>
                <Column>
                  <Text style={productName}>{item.name}</Text>
                  <Text style={productDetails}>Cantidad: {item.quantity}</Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={price}>{formatPrice(item.priceAtPurchase * item.quantity)}</Text>
                </Column>
              </Row>
              <Hr style={itemHr} />
            </Section>
          ))}

          <Hr style={hr} />
          
          <Section style={totalsSection}>
            {/* --- Subtotal --*/}
            <Row>
              <Column style={totalsLabelColumn}><Text style={totalsText}>Subtotal</Text></Column>
              <Column style={totalsValueColumn}><Text style={totalsText}>{formatPrice(subtotal)}</Text></Column>
            </Row>
            
            {/* --- Descuento (si aplica) --*/}
            {discount > 0 && (
              <Row>
                <Column style={totalsLabelColumn}><Text style={totalsText}>Descuento Aplicado</Text></Column>
                <Column style={totalsValueColumn}><Text style={totalsText}>- {formatPrice(discount)}</Text></Column>
              </Row>
            )}

            {/* --- Total General --*/}
            <Row style={{ marginTop: '10px' }}>
              <Column style={totalsLabelColumn}><Text style={{...totalsText, ...totalRow}}><strong>Total General</strong></Text></Column>
              <Column style={totalsValueColumn}><Text style={{...price, ...totalRow}}><strong>{formatPrice(totalAmount)}</strong></Text></Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            Gracias por confiar en nosotros para ser parte de tu brillo.
          </Text>
          <Text style={footer}>
            El equipo de Osadía Joyas
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ConfirmationEmail;

// --- Estilos ---

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const logoContainer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  padding: '0 20px',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  padding: '0 20px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#555',
  padding: '0 20px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const itemHr = {
  borderColor: '#eaeaea',
  margin: '10px 20px 0',
}

const itemSection = {
  padding: '0 20px',
};

const productImage = {
  borderRadius: '4px',
  border: '1px solid #eaeaea',
  objectFit: 'cover' as const,
};

const productName = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 5px 0',
};

const productDetails = {
  fontSize: '14px',
  color: '#777',
  margin: 0,
};

const priceColumn = {
  textAlign: 'right' as const,
  verticalAlign: 'middle',
};

const price = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: 0,
};

const totalsSection = {
  padding: '0 20px',
};

const totalsLabelColumn = {
  textAlign: 'left' as const,
};

const totalsValueColumn = {
  textAlign: 'right' as const,
};

const totalsText = {
  fontSize: '16px',
  color: '#555',
  margin: '4px 0',
};

const totalRow = {
  fontSize: '18px',
  fontWeight: 'bold',
};


const footer = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 20px',
};
