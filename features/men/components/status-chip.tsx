'use client';

import React from 'react';
import { Chip } from '@/components/heroui';

export function StatusChip({ status }: { status: number | null }) {
  if (status == null) return <Chip color="default" size="sm" variant="flat">Inconnu</Chip>;
  if (status === 4) return <Chip color="success" size="sm" variant="flat">Actif</Chip>;
  if (status === 3) return <Chip color="primary" size="sm" variant="flat">Validé</Chip>;
  if (status === 5 || status === 0) return <Chip color="danger" size="sm" variant="flat">Inactif</Chip>;
  // status 2 ou autre = en attente de validation
  return <Chip color="warning" size="sm" variant="flat">En attente</Chip>;
}
