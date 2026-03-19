
export interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription?: string;
  sku?: string;
  price: number;
  salePrice: number | null; // El precio final de oferta (calculado)
  images: string[];
  categoryIds: number[];
  stock: number;
  featured?: boolean;
  createdAt?: Date;
  discountPercentage?: number | null;
  offerStartDate?: Date | null;
  offerEndDate?: Date | null;
  aiHint?: string;
  crossSellIds?: number[];
}

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// --- TIPOS DE ORDEN MEJORADOS ---

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'awaiting_payment_in_store' | 'pending_payment' | 'failed' | 'refunded';

// Representa un item DENTRO de una orden ya creada.
export interface OrderItem {
  productId: number;
  name: string; // CORREGIDO: de "String" a string
  image: string; // CORREGIDO: de "String" a string
  quantity: number;
  priceAtPurchase: number; // Precio unitario final al que se vendió
  originalPrice: number | null; // Precio original sin descuento, para referencia
}

export type DeliveryMethod = 'pickup' | 'shipping' | 'pay_in_store';

export type PaymentType = 'Efectivo' | 'Transferencia' | 'QR / Tarjeta';


// Datos necesarios para CREAR una nueva orden.
export interface OrderData {
  items: OrderItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  paymentType: PaymentType;
  couponCode?: string;
  discountAmount?: number;
  pickupName?: string;
  pickupDni?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  notes?: string;
}


// Representa una orden COMPLETA, tal como se guarda en la DB.
export interface Order extends Omit<OrderData, 'items'> {
  id: number;
  createdAt: Date;
  items: OrderItem[]; // El JSONB de items
  paymentId?: string; // ID de la transacción de MP
}

export interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number | null;
  expiryDate?: Date;
  isActive: boolean;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalSales: number;
  pendingOrders: number;
  topSellingProducts: {
    productId: number;
    name: string;
    count: number;
  }[];
  topRevenueProducts: {
    productId: number;
    name: string;
    revenue: number;
  }[];
  revenueByDate: {
    date: string; // 'YYYY-MM-DD'
    revenue: number;
    estimatedRevenue: number;
    orders: number;
    allOrders: number;
  }[];
}

// --- NUEVO TIPO PARA SUSCRIPTORES ---
export interface Subscriber {
  email: string;
  firstName?: string;
  lastName?: string;
}
