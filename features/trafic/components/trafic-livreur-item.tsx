'use client';

import { Avatar, Chip } from '@heroui/react';
import { Phone, MapPin } from 'lucide-react';

import { LivreurTrafic } from '@/features/trafic/types/trafic.type';
import { createUrlFile } from '@/utils/createUrlFile';

type LivreurStatus = 'disponible' | 'enActivite' | 'indisponible';

interface TraficLivreurItemProps {
  livreur: LivreurTrafic;
  status: LivreurStatus;
  isSelected: boolean;
  isDisabled?: boolean;
  onSelect: (livreurId: string) => void;
}

const STATUS_CHIP: Record<LivreurStatus, { label: string; color: 'success' | 'warning' | 'default' }> = {
  disponible: { label: 'Disponible', color: 'success' },
  enActivite: { label: 'En livraison', color: 'warning' },
  indisponible: { label: 'Indisponible', color: 'default' },
};

export default function TraficLivreurItem({
  livreur,
  status,
  isSelected,
  isDisabled = false,
  onSelect,
}: TraficLivreurItemProps) {
  const chip = STATUS_CHIP[status];
  const hasPosition = livreur.position.latitude !== 0 || livreur.position.longitude !== 0;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(livreur.livreurId)}
      className={[
        'text-left flex items-center gap-2 p-2 rounded-lg border border-default-200 bg-content1 transition-colors',
        'hover:bg-default-100 hover:border-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40',
        isSelected ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/40' : '',
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <Avatar
        size="sm"
        src={livreur.avatarUrl ? createUrlFile(livreur.avatarUrl, 'backend') : undefined}
        name={livreur.nomComplet}
        className="shrink-0 w-8 h-8"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate leading-tight">{livreur.nomComplet}</div>
        <div className="flex items-center gap-1 text-[11px] text-default-500 leading-tight">
          <Phone className="w-3 h-3 shrink-0" />
          <span className="truncate">{livreur.telephone || '—'}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Chip size="sm" variant="flat" color={chip.color} className="h-4 text-[10px] px-1">
            {chip.label}
          </Chip>
          {hasPosition && <MapPin className="w-3 h-3 text-default-400" aria-label="GPS connu" />}
        </div>
      </div>
    </button>
  );
}
