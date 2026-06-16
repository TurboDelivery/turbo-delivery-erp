'use client';

import { Chip } from '@heroui/react';
import { STATUT_LABEL, StatutIncident } from '@/features/standard';

const COLOR: Record<StatutIncident, 'danger' | 'warning' | 'primary' | 'success'> = {
  RECU: 'danger',
  EN_COURS: 'warning',
  TRAITE: 'primary',
  CLOTURE: 'success',
};

/** Pastille de statut d'incident, couleur alignée sur le cycle de vie RG-24. */
export function IncidentStatutChip({ statut, size = 'sm' }: { statut: StatutIncident; size?: 'sm' | 'md' }) {
  return (
    <Chip color={COLOR[statut]} variant="flat" size={size}>
      {STATUT_LABEL[statut]}
    </Chip>
  );
}
