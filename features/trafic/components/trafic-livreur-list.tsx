'use client';

import TraficLivreurItem from '@/features/trafic/components/trafic-livreur-item';
import { LivreurTrafic } from '@/features/trafic/types/trafic.type';

type LivreurStatus = 'disponible' | 'enActivite' | 'indisponible';

interface TraficLivreurListProps {
  livreurs: LivreurTrafic[];
  status: LivreurStatus;
  selectedLivreurId: string | null;
  onSelect: (livreurId: string) => void;
  emptyLabel?: string;
}

export default function TraficLivreurList({
  livreurs,
  status,
  selectedLivreurId,
  onSelect,
  emptyLabel = 'Aucun livreur',
}: TraficLivreurListProps) {
  if (livreurs.length === 0) {
    return <p className="text-sm italic text-default-500 py-6 text-center">{emptyLabel}</p>;
  }

  return (
    <div
      className="overflow-y-auto overflow-x-hidden scrollbar-thin"
      style={{ maxHeight: '15rem' }}
    >
      <div className="grid gap-2 pr-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {livreurs.map((livreur) => (
          <TraficLivreurItem
            key={livreur.livreurId}
            livreur={livreur}
            status={status}
            isSelected={selectedLivreurId === livreur.livreurId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
