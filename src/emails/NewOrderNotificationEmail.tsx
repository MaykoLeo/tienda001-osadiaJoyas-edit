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
import { OrderItem } from '@/lib/types';

interface NewOrderNotificationEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderItems: OrderItem[];
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

const formatPrice = (amount: number) => {
    return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const NewOrderNotificationEmail: React.FC<Readonly<NewOrderNotificationEmailProps>> = ({
  orderId,
  customerName,
  customerEmail,
  totalAmount,
  orderItems,
}) => (
  <Html>
    <Head />
    <Preview>¡Nueva orden! Prepara el pedido #{orderId}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${baseUrl}/osadia-logo-completo.jpg`}
            width="150"
            height="auto"
            alt="Osadia Joyas"
          />
        </Section>
        <Heading style={h1}>¡Nueva Venta!</Heading>
        <Text style={text}>
          Has recibido una nueva orden. Aquí están los detalles:
        </Text>
        <Section style={box}>
            <Text><strong>Número de Pedido:</strong> #{orderId}</Text>
            <Text><strong>Cliente:</strong> {customerName}</Text>
            <Text><strong>Email del Cliente:</strong> <Link href={`mailto:${customerEmail}`}>{customerEmail}</Link></Text>
            <Text><strong>Monto Total:</strong> {formatPrice(totalAmount)}</Text>
        </Section>
        
        <Hr style={hr} />

        <Heading as="h2" style={h2}>
          Artículos del Pedido:
        </Heading>
        {orderItems.map((item) => (
            <Section key={item.productId} style={itemSection}>
                 <Row>
                    <Column>
                        <Text style={itemText}><strong>{item.name}</strong></Text>
                        <Text style={itemDetails}>Cantidad: {item.quantity}</Text>
                        <Text style={itemDetails}>Precio unitario: {formatPrice(item.priceAtPurchase)}</Text>
                    </Column>
                 </Row>
                 <Hr style={hr} />
            </Section>
        ))}

        <Text style={footer}>
          Es hora de preparar el pedido para su envío.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default NewOrderNotificationEmail;


const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
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
};

const h2 = {
    color: '#333',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '20px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const box = {
    backgroundColor: '#f8f8f8',
    padding: '15px',
    borderRadius: '5px',
    border: '1px solid #eaeaea',
}

const itemSection = {
    padding: '10px 0',
}

const itemText = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
}

const itemDetails = {
    fontSize: '14px',
    color: '#555',
    lineHeight: '20px',
}

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
