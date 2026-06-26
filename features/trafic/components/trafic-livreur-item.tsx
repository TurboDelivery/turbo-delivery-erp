'use client';

import { Avatar, Button, Chip } from '@heroui/react';
import { MapPin, PackagePlus, Phone } from 'lucide-react';

import { LivreurTrafic } from '@/features/trafic/types/trafic.type';
import { createUrlFile } from '@/utils/createUrlFile';

type LivreurStatus = 'disponible' | 'enActivite' | 'indisponible' | 'horsRayon';

interface TraficLivreurItemProps {
  livreur: LivreurTrafic;
  status: LivreurStatus;
  isSelected: boolean;
  isDisabled?: boolean;
  onSelect: (livreurId: string) => void;
  onAffecter?: (livreur: LivreurTrafic) => void;
}

const STATUS_CHIP: Record<LivreurStatus, { label: string; color: 'success' | 'warning' | 'default' | 'danger' }> = {
  disponible: { label: 'Disponible', color: 'success' },
  enActivite: { label: 'En livraison', color: 'warning' },
  indisponible: { label: 'Indisponible', color: 'default' },
  horsRayon: { label: 'Hors rayon', color: 'danger' },
};

/** Temps écoulé depuis le dernier point GPS (maquette « · 12 s »). */
function tempsEcoule(iso?: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `il y a ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function TraficLivreurItem({
  livreur,
  status,
  isSelected,
  isDisabled = false,
  onSelect,
  onAffecter,
}: TraficLivreurItemProps) {
  const chip = STATUS_CHIP[status];
  const maj = tempsEcoule(livreur.dernierPointAt);
  const hasPosition = livreur.position.latitude !== 0 || livreur.position.longitude !== 0;
  // Affectable depuis la carte : disponible ou hors-rayon (pas en course / indisponible).
  const affectable = !!onAffecter && (status === 'disponible' || status === 'horsRayon');

  const select = () => {
    if (!isDisabled) onSelect(livreur.livreurId);
  };

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-pressed={isSelected}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      }}
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
        <div className="flex flex-wrap items-center gap-1 mt-1">
          <Chip size="sm" variant="flat" color={chip.color} className="h-4 text-[10px] px-1">
            {chip.label}
          </Chip>
          {livreur.quartier && (
            <span className="text-[10px] text-default-400 truncate max-w-[8rem]">{livreur.quartier}</span>
          )}
          {maj && <span className="text-[10px] text-default-400">· {maj}</span>}
          {hasPosition && <MapPin className="w-3 h-3 text-default-400" aria-label="GPS connu" />}
        </div>
      </div>
      {affectable && (
        <Button
          size="sm"
          isIconOnly
          variant="flat"
          color="primary"
          aria-label="Affecter une course"
          className="shrink-0"
          onPress={() => onAffecter?.(livreur)}
        >
          <PackagePlus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
