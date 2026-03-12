'use server';

import { getProductsByIds } from './data';
import { Product, CartItem } from './types';

const getCurrentPrice = (product: Product): number => {
    if (product.salePrice && product.salePrice < product.price) {
        return product.salePrice;
    }
    return product.price;
};

interface CartItemForVerification {
  productId: number;
  quantity: number;
  priceInCart: number;
}

export interface VerificationResult {
  hasChanges: boolean;
  updatedCartItems: CartItem[];
  messages: string[];
}

export async function verifyCartPrices(
  itemsToVerify: CartItemForVerification[]
): Promise<VerificationResult> {
  
  const productIds = itemsToVerify.map(item => item.productId);
  if (productIds.length === 0) {
      return { hasChanges: false, updatedCartItems: [], messages: [] };
  }

  const dbProducts = await getProductsByIds(productIds);
  const dbProductsMap = new Map(dbProducts.map(p => [p.id, p]));

  const messages: string[] = [];
  let hasChanges = false;

  const updatedCartItems: CartItem[] = [];

  for (const item of itemsToVerify) {
    const dbProduct = dbProductsMap.get(item.productId);

    if (!dbProduct) {
      hasChanges = true;
      messages.push(`Uno de tus productos ya no está disponible y fue eliminado del carrito.`);
      continue;
    }
    
    const currentPrice = getCurrentPrice(dbProduct);

    if (currentPrice !== item.priceInCart) {
      hasChanges = true;
      messages.push(`El precio de "${dbProduct.name}" cambió a ${currentPrice.toFixed(2)} ARS.`);
    }

    let adjustedQuantity = item.quantity;
    if (dbProduct.stock < item.quantity) {
      hasChanges = true;
      adjustedQuantity = dbProduct.stock;
      if(dbProduct.stock > 0){
        messages.push(`El stock de "${dbProduct.name}" se redujo. Ahora tienes ${adjustedQuantity} en tu carrito.`);
      } else {
        messages.push(`"${dbProduct.name}" se quedó sin stock y fue eliminado de tu carrito.`);
      }
    }
    
    if (adjustedQuantity > 0) {
        updatedCartItems.push({
            product: dbProduct,
            quantity: adjustedQuantity
        });
    }
  }

  return {
    hasChanges,
    updatedCartItems,
    messages
  };
}
