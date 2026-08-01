'use client';

import { STATUT_LABEL, StatutIncident } from '@/features/standard';

import { TON_INCIDENT } from '../utils/incident-ui.utils';

const TAILLE = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
} as const;

/**
 * Pastille d'état d'un incident (cycle de vie RG-24) : fond teinté, texte petit
 * et gras. Le rouge signale ce que personne n'a encore pris en charge.
 */
export function IncidentStatutChip({ statut, size = 'sm' }: { statut: StatutIncident; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-bold uppercase tracking-wide ${TAILLE[size]} ${TON_INCIDENT[statut].etat}`}
    >
      {STATUT_LABEL[statut]}
    </span>
  );
}
