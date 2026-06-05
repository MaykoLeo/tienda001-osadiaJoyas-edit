import { Order } from '@/lib/types';
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
  Column,
  Link
} from '@react-email/components';
import * as React from 'react';

interface ConfirmationEmailProps {
  order: Order;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? process.env.NEXT_PUBLIC_SITE_URL 
  : process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

const formatPrice = (amount: number) => {
  return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getDeliveryInstructions = (order: Order) => {
    if (order.status === 'deposit_paid') {
        const remaining = order.remainingAmount ?? (order.total * 0.70);
        return `¡Tu seña fue acreditada! Tu pedido #${order.id} está reservado. Cuando vengas al local a retirar tus joyas, solo te queda abonar el saldo restante de $ ${remaining.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Recuerda indicar tu número de pedido y presentar tu DNI (${order.pickupDni}).`;
    }
    if (order.deliveryMethod === 'shipping') {
        return `Estamos preparando tu pedido para enviarlo a ${order.shippingAddress}, ${order.shippingLocality}. Te notificaremos cuando esté en camino.`;
    }
    if (order.deliveryMethod === 'pay_in_store') {
        return `Tu pedido está reservado. Te esperamos en nuestro local para que realices el pago y retires tus joyas. Recuerda indicar tu nombre (${order.customerFirstName} ${order.customerLastName}).`;
    }
    return `Tu pedido ya está pago y listo. Te esperamos en nuestro local para que retires tus joyas. Por favor ven con tu DNI (${order.pickupDni}).`;
};

export const ConfirmationEmail: React.FC<Readonly<ConfirmationEmailProps>> = ({ 
  order,
}) => {
  const subtotal = order.items.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);
  const isDepositOrder = order.status === 'deposit_paid';
  const depositAmount = order.depositAmount ?? (isDepositOrder ? order.total * 0.30 : null);
  const remainingAmount = order.remainingAmount ?? (isDepositOrder ? order.total * 0.70 : null);
  const discount = subtotal - order.total;

  return (
    <Html>
      <Head />
      <Preview>{isDepositOrder ? `¡Seña recibida! Tu pedido #${order.id} en Osadía Joyas está reservado` : 'Confirmación de tu pedido en Osadía Joyas'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}/osadia-logo-completo.jpg`}
              width="200"
              height="55"
              alt="Osadía Joyas Logo"
              style={{ margin: '0 auto' }}
            />
          </Section>
        <Heading style={h1}>{isDepositOrder ? `¡Seña recibida, ${order.customerFirstName}!` : `¡Gracias por tu compra, ${order.customerFirstName}!`}</Heading>
          <Text style={paragraph}>
            Hemos registrado tu pedido <strong>#{order.id}</strong> correctamente. 
            {getDeliveryInstructions(order)}
            Cualquier consulta no dudes en escribirnos a nuestro Whatsapp o a este mismo correo.
          </Text>
          
          <Hr style={hr} />

          <Heading style={h2}>Resumen de tu compra</Heading>
          
          {order.items.map((item) => (
            <Section key={item.productId} style={itemSection}>
              <Row>
                <Column style={{ width: '80px' }}>
                  <Img 
                    src={item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`} 
                    alt={item.name} 
                    width="70" 
                    height="70" 
                    style={productImage}
                  />
                </Column>
                <Column>
                  <Text style={productName}>{item.name}</Text>
                  <Text style={productDetails}>Cantidad: {item.quantity}</Text>
                  <Text style={productDetails}>Precio unitario: {formatPrice(item.priceAtPurchase)}</Text>
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
            <Row>
              <Column style={totalsLabelColumn}><Text style={totalsText}>Subtotal</Text></Column>
              <Column style={totalsValueColumn}><Text style={totalsText}>{formatPrice(subtotal)}</Text></Column>
            </Row>
            
            {discount > 0 && (
              <Row>
                <Column style={totalsLabelColumn}><Text style={totalsText}>Descuento Aplicado</Text></Column>
                <Column style={totalsValueColumn}><Text style={totalsText}>- {formatPrice(discount)}</Text></Column>
              </Row>
            )}

            <Row style={{ marginTop: '10px' }}>
              <Column style={totalsLabelColumn}><Text style={{...totalsText, ...totalRow}}><strong>Total General</strong></Text></Column>
              <Column style={totalsValueColumn}><Text style={{...price, ...totalRow}}><strong>{formatPrice(order.total)}</strong></Text></Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {isDepositOrder && depositAmount !== null && remainingAmount !== null && (
            <Section style={{ ...totalsSection, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginBottom: '20px' }}>
              <Text style={{ ...productName, color: '#15803d', textAlign: 'center' as const }}>✅ Seña acreditada exitosamente</Text>
              <Row>
                <Column style={totalsLabelColumn}><Text style={totalsText}>Seña abonada (30%):</Text></Column>
                <Column style={totalsValueColumn}><Text style={{ ...totalsText, fontWeight: 'bold', color: '#15803d' }}>{formatPrice(depositAmount)}</Text></Column>
              </Row>
              <Row>
                <Column style={totalsLabelColumn}><Text style={totalsText}>Saldo a pagar en local (70%):</Text></Column>
                <Column style={totalsValueColumn}><Text style={{ ...totalsText, fontWeight: 'bold' }}>{formatPrice(remainingAmount)}</Text></Column>
              </Row>
            </Section>
          )}

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
  width: '600px',
  maxWidth: '100%',
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
};

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
};

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
  padding: '20px',
  backgroundColor: '#fafafa',
  borderTop: '1px solid #eaeaea',
  borderBottom: '1px solid #eaeaea',
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
  color: '#111',
};

const footer = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 20px',
  textAlign: 'center' as const,
};
