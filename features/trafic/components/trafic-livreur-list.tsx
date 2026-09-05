'use client';

import TraficLivreurItem from '@/features/trafic/components/trafic-livreur-item';
import { LivreurTraficVue } from '@/features/trafic/utils/normaliser-trafic';

interface TraficLivreurListProps {
  livreurs: LivreurTraficVue[];
  selectedLivreurId: string | null;
  onSelect: (livreurId: string) => void;
  onAffecter?: (livreur: LivreurTraficVue) => void;
  isLoading?: boolean;
  emptyLabel?: string;
}

export default function TraficLivreurList({
  livreurs,
  selectedLivreurId,
  onSelect,
  onAffecter,
  isLoading = false,
  emptyLabel = 'Aucun livreur ne correspond à ce filtre.',
}: TraficLivreurListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="h-[86px] w-full animate-pulse rounded-xl bg-surface-secondary" key={i} />
        ))}
      </div>
    );
  }

  if (livreurs.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {livreurs.map((livreur) => (
        <TraficLivreurItem
          key={livreur.livreurId}
          livreur={livreur}
          isSelected={selectedLivreurId === livreur.livreurId}
          onSelect={onSelect}
          onAffecter={onAffecter}
        />
      ))}
    </div>
  );
}
