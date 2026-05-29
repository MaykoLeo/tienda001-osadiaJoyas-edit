import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { Order } from '@/lib/types';

interface NewOrderNotificationEmailProps {
  order: Order;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:9002';

const formatPrice = (amount: number) => {
    return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getOrderTypeString = (order: Order) => {
    if (order.deliveryMethod === 'shipping') return 'Envío a Domicilio';
    if (order.deliveryMethod === 'pay_in_store') return 'Pago en Local y Retiro';
    if (order.deliveryMethod === 'pickup') {
        if (order.paymentId) return 'Pagado Online y Retiro en Local';
        return 'Retiro en Local'; // Posiblemente creado manual, o abandonado
    }
    return 'Desconocido';
};

export const NewOrderNotificationEmail: React.FC<Readonly<NewOrderNotificationEmailProps>> = ({
  order,
}) => {
  const subtotal = order.items.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);
  const discount = subtotal - order.total;
  const orderTypeStr = getOrderTypeString(order);

  return (
    <Html>
      <Head />
      <Preview>{`¡Nueva orden! Prepara el pedido #${order.id}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}/osadia-logo-completo.jpg`}
              width="200"
              height="55"
              alt="Osadia Joyas"
              style={{ margin: '0 auto' }}
            />
          </Section>
          <Heading style={h1}>¡Nueva Venta!</Heading>
          <Text style={text}>
            Has recibido una nueva orden. Aquí están los detalles para que puedas prepararla:
          </Text>
          
          <Section style={box}>
              <Heading as="h3" style={h3}>Datos de la Orden</Heading>
              <Text style={detailText}><strong>Número de Pedido:</strong> #{order.id}</Text>
              <Text style={detailText}><strong>Tipo de Pedido:</strong> <span style={highlight}>{orderTypeStr}</span></Text>
              <Text style={detailText}><strong>Estado:</strong> {order.status === 'awaiting_payment_in_store' ? 'Esperando Pago en Local' : order.status === 'paid' ? 'Abonado' : order.status}</Text>
          </Section>

          <Section style={box}>
              <Heading as="h3" style={h3}>Datos del Cliente</Heading>
              <Text style={detailText}><strong>Nombre:</strong> {order.customerFirstName} {order.customerLastName}</Text>
              <Text style={detailText}><strong>Email:</strong> <Link href={`mailto:${order.customerEmail}`}>{order.customerEmail}</Link></Text>
              {order.customerPhone && <Text style={detailText}><strong>Teléfono:</strong> {order.customerPhone}</Text>}
              {order.pickupDni && <Text style={detailText}><strong>DNI:</strong> {order.pickupDni}</Text>}
          </Section>

          {order.deliveryMethod === 'shipping' && (
            <Section style={box}>
                <Heading as="h3" style={h3}>Datos de Envío</Heading>
                <Text style={detailText}><strong>Dirección:</strong> {order.shippingAddress}</Text>
                <Text style={detailText}><strong>Localidad:</strong> {order.shippingLocality}</Text>
                {order.shippingProvince && <Text style={detailText}><strong>Provincia:</strong> {order.shippingProvince}</Text>}
            </Section>
          )}

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Artículos del Pedido:
          </Heading>
          
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
                          <Text style={itemText}><strong>{item.name}</strong></Text>
                          <Text style={itemDetails}>Cantidad: {item.quantity}</Text>
                          <Text style={itemDetails}>Precio unitario: {formatPrice(item.priceAtPurchase)}</Text>
                      </Column>
                      <Column style={priceColumn}>
                        <Text style={priceText}>{formatPrice(item.priceAtPurchase * item.quantity)}</Text>
                      </Column>
                   </Row>
                   <Hr style={itemHr} />
              </Section>
          ))}

          <Section style={totalsSection}>
            <Row>
              <Column style={totalsLabelColumn}><Text style={totalsText}>Subtotal</Text></Column>
              <Column style={totalsValueColumn}><Text style={totalsText}>{formatPrice(subtotal)}</Text></Column>
            </Row>
            
            {discount > 0 && (
              <Row>
                <Column style={totalsLabelColumn}><Text style={totalsText}>Descuento</Text></Column>
                <Column style={totalsValueColumn}><Text style={totalsText}>- {formatPrice(discount)}</Text></Column>
              </Row>
            )}

            <Row style={{ marginTop: '10px' }}>
              <Column style={totalsLabelColumn}><Text style={{...totalsText, ...totalRow}}><strong>Total General</strong></Text></Column>
              <Column style={totalsValueColumn}><Text style={{...priceText, ...totalRow}}><strong>{formatPrice(order.total)}</strong></Text></Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Es hora de preparar el pedido.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NewOrderNotificationEmail;


const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
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
    margin: '20px 0',
    padding: '0 20px',
};

const h3 = {
    color: '#555',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textTransform: 'uppercase' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 20px',
};

const box = {
    backgroundColor: '#f8f8f8',
    padding: '20px',
    margin: '10px 20px',
    borderRadius: '5px',
    border: '1px solid #eaeaea',
};

const detailText = {
    fontSize: '14px',
    color: '#333',
    margin: '4px 0',
};

const highlight = {
    color: '#0056b3',
    fontWeight: 'bold',
};

const itemSection = {
    padding: '10px 20px',
};

const productImage = {
  borderRadius: '4px',
  border: '1px solid #eaeaea',
  objectFit: 'cover' as const,
};

const itemText = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 5px 0',
};

const itemDetails = {
    fontSize: '14px',
    color: '#555',
    margin: '2px 0',
};

const priceColumn = {
  textAlign: 'right' as const,
  verticalAlign: 'middle',
};

const priceText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: 0,
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const itemHr = {
  borderColor: '#eaeaea',
  margin: '10px 0 0 0',
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
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 20px',
};
