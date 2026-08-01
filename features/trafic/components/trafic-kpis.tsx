'use client';

import { Skeleton } from '@heroui/react';
import { Bike, CalendarOff, CheckCircle2, PauseCircle } from 'lucide-react';

import { StatutTrafic } from '@/features/trafic/types/trafic.type';
import { FiltreStatut } from '@/features/trafic/hooks/use-trafic';
import { STATUT_TRAFIC_META, STATUTS_ORDONNES } from '@/features/trafic/utils/statut-trafic';

const ICONES: Record<StatutTrafic, React.ComponentType<{ className?: string }>> = {
  DISPONIBLE: CheckCircle2,
  EN_COURSE: Bike,
  EN_PAUSE: PauseCircle,
  HORS_SERVICE: CalendarOff,
};

interface TraficKpisProps {
  compteurs: Record<StatutTrafic, number>;
  statutActif: FiltreStatut;
  onStatutChange: (statut: FiltreStatut) => void;
  isLoading?: boolean;
}

/**
 * Les quatre compteurs de tête d'écran — et leur définition.
 *
 * Chaque carte porte SA phrase : c'est le correctif de fond de la refonte.
 * « Disponible » ne veut plus dire « une case était cochée » mais « a pointé,
 * est en file, recevra une course ». Cliquer une carte filtre l'écran entier.
 */
export function TraficKpis({ compteurs, statutActif, onStatutChange, isLoading = false }: TraficKpisProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {STATUTS_ORDONNES.map((statut) => {
        const meta = STATUT_TRAFIC_META[statut];
        const Icone = ICONES[statut];
        const actif = statutActif === statut;

        return (
          <button
            key={statut}
            type="button"
            aria-pressed={actif}
            onClick={() => onStatutChange(actif ? 'TOUS' : statut)}
            className={[
              'rounded-2xl border bg-white p-4 text-left transition-all dark:bg-content1',
              'hover:border-default-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              actif
                ? 'border-default-900 ring-1 ring-default-900'
                : 'border-default-200/50',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: meta.fond, color: meta.couleur }}
              >
                <Icone className="h-[22px] w-[22px]" />
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg" />
              ) : (
                <span
                  className="text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: meta.couleur }}
                >
                  {compteurs[statut]}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold leading-tight">{meta.libelle}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-default-500">{meta.explication}</p>
          </button>
        );
      })}
    </div>
  );
}
