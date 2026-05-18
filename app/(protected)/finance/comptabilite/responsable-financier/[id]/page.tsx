'use client';

import { notFound } from 'next/navigation';
import { Skeleton } from '@heroui/react';
import FactureDetailView from '@/components/finance/responsable-financier/facture-detail-view';
import { useFactureRFQuery } from '@/features/responsable-financier';

interface Props {
  params: { id: string };
}

export default function FactureDetailPage({ params }: Props) {
  const { data: facture, isLoading, isError } = useFactureRFQuery(params.id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-10 w-64 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError || !facture) notFound();

  return <FactureDetailView facture={facture} />;
}
