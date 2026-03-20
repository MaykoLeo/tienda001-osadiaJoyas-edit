
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TiendaContent } from './TiendaContent';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Tienda',
};

export default async function TiendaPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="container mx-auto px-6 lg:px-10 py-8">
      <Suspense fallback={<Skeleton className="h-screen w-full" />}>
        <TiendaContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
