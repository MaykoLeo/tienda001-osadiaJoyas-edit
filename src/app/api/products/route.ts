
import { NextRequest, NextResponse } from 'next/server';
import { getFilteredProducts } from '@/lib/data/products';

// Helper to safely get the first value if a param is an array
function getSingleValue(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const query = searchParams.get('q') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  const pageRaw = searchParams.get('page');
  const limitRaw = searchParams.get('limit');
  const onSaleRaw = searchParams.get('onSale');
  const featuredRaw = searchParams.get('featured');
  const sortByRaw = searchParams.get('sortBy');
  const sortDirectionRaw = searchParams.get('sortDirection');
  
  const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const page = pageRaw ? Number(pageRaw) : 1;
  const limit = limitRaw ? Number(limitRaw) : 12;
  const onSale = onSaleRaw === 'true' ? true : undefined;
  const featured = featuredRaw === 'true' ? true : undefined;
  
  const sortBy = ['price', 'createdAt', 'name'].includes(sortByRaw || '') 
    ? (sortByRaw as 'price' | 'createdAt' | 'name') 
    : 'createdAt';

  const sortDirection = ['asc', 'desc'].includes(sortDirectionRaw || '')
    ? (sortDirectionRaw as 'asc' | 'desc')
    : 'desc';

  try {
    const products = await getFilteredProducts({
      query,
      category,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      sortDirection,
      featured,
      onSale,
    });
    
    return NextResponse.json({ products });

  } catch (error) {
    console.error('API Error fetching products:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
