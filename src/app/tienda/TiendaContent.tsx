
import { Suspense } from 'react';
import { getCategories } from '@/lib/data/categories';
import { getFilteredProducts } from '@/lib/data/products';
import { TiendaPageClient } from './TiendaPageClient';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 6;

// Helper to safely get the first value if a param is an array
function getSingleValue(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

export async function TiendaContent({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const {
    q: queryParam,
    category: categoryParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    page: pageParam,
    onSale: onSaleParam,
    featured: featuredParam,
    sortBy: sortByParam,
    sortDirection: sortDirectionParam,
  } = searchParams || {};

  const query = getSingleValue(queryParam);
  const category = getSingleValue(categoryParam);
  const minPriceRaw = getSingleValue(minPriceParam);
  const maxPriceRaw = getSingleValue(maxPriceParam);
  const pageRaw = getSingleValue(pageParam);
  const onSaleRaw = getSingleValue(onSaleParam);
  const featuredRaw = getSingleValue(featuredParam);
  const sortByRaw = getSingleValue(sortByParam);
  const sortDirectionRaw = getSingleValue(sortDirectionParam);

  const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const page = pageRaw ? Number(pageRaw) : 1;
  const onSale = onSaleRaw === 'true' ? true : undefined;
  const featured = featuredRaw === 'true' ? true : undefined;

  const sortBy: 'price' | 'createdAt' | 'name' =
    ['price', 'createdAt', 'name'].includes(sortByRaw || '')
      ? (sortByRaw as 'price' | 'createdAt' | 'name')
      : 'createdAt';

  const sortDirection: 'asc' | 'desc' =
    ['asc', 'desc'].includes(sortDirectionRaw || '')
      ? (sortDirectionRaw as 'asc' | 'desc')
      : 'desc';

  const queryParams = {
    query,
    category,
    minPrice,
    maxPrice,
    page,
    limit: ITEMS_PER_PAGE,
    sortBy,
    sortDirection,
    featured,
    onSale,
  };

  const allCategoriesPromise = getCategories();
  const offerProductsPromise = getFilteredProducts({ onSale: true, limit: 4 });
  const initialProductsPromise = getFilteredProducts(queryParams);
  const checkNextPagePromise = getFilteredProducts({
    ...queryParams,
    page: queryParams.page + 1,
  });

  const [
    allCategories,
    offerProducts,
    initialProducts,
    nextPageProducts,
  ] = await Promise.all([
    allCategoriesPromise,
    offerProductsPromise,
    initialProductsPromise,
    checkNextPagePromise,
  ]);

  const initialHasMore = nextPageProducts.length > 0;

  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <TiendaPageClient
        allCategories={allCategories}
        offerProducts={offerProducts}
        initialProducts={initialProducts}
        initialHasMore={initialHasMore}
      />
    </Suspense>
  );
}
