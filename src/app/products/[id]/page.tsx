
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/data/products';
import { ProductPageClient } from './ProductPageClient';
import type { Product } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }
  const product = await getProductById(numericId);

  if (!product) {
    return {
      title: 'Producto no encontrado',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${product.name} | Joya - Elegancia Atemporal`,
    description: product.shortDescription || product.description,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description,
      images: [product.images[0], ...previousImages],
    },
  }
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  
  let relatedProducts: Product[] = [];
  
  if (product.crossSellIds && product.crossSellIds.length > 0) {
      relatedProducts = allProducts.filter(p => product.crossSellIds!.includes(p.id));
  }

  // Si no hay suficientes, rellenar con productos de la misma categoría automáticamente
  if (relatedProducts.length < 4) {
      const categoryProducts = allProducts.filter(p =>
        p.id !== product.id &&
        p.categoryIds.some(catId => product.categoryIds.includes(catId)) &&
        !relatedProducts.some(rp => rp.id === p.id)
      ).slice(0, 4 - relatedProducts.length);
      relatedProducts = [...relatedProducts, ...categoryProducts];
  }

  return <ProductPageClient product={product} relatedProducts={relatedProducts} />;
}
