'use client';

import React from 'react';
import { Chip } from '@heroui/react';

export function StatusChip({ status }: { status: number }) {
  if (status === 1) return <Chip color="success" size="sm" variant="flat">Activé</Chip>;
  if (status === 0) return <Chip color="danger" size="sm" variant="flat">Inactif</Chip>;
  return <Chip color="warning" size="sm" variant="flat">En attente</Chip>;
}
