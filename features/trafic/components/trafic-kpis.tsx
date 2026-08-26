'use client';

import type { LucideIcon } from 'lucide-react';
import { Bike, CalendarOff, CheckCircle2, PauseCircle } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { StatutTrafic } from '@/features/trafic/types/trafic.type';
import { FiltreStatut } from '@/features/trafic/hooks/use-trafic';
import { STATUT_TRAFIC_META, STATUTS_ORDONNES } from '@/features/trafic/utils/statut-trafic';

const ICONES: Record<StatutTrafic, LucideIcon> = {
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
    <GrilleStats colonnes={4}>
      {STATUTS_ORDONNES.map((statut) => {
        const meta = STATUT_TRAFIC_META[statut];
        const actif = statutActif === statut;

        return (
          <CarteStat
            key={statut}
            libelle={meta.libelle}
            valeur={compteurs[statut]}
            note={meta.explication}
            icone={ICONES[statut]}
            ton={meta.ton}
            isLoading={isLoading}
            // Recliquer la carte active retire le filtre : sans cela, l'operateur
            // n'aurait aucun moyen de revenir a la vue complete depuis les compteurs.
            onClick={() => onStatutChange(actif ? 'TOUS' : statut)}
            estActif={actif}
          />
        );
      })}
    </GrilleStats>
  );
}
