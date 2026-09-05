'use client';

import { Chip } from '@heroui-v3/react';
import React from 'react';

/**
 * L'état du compte d'un coursier.
 *
 * <p>`color` porte l'échelle sémantique, `variant` l'intensité : c'est la convention
 * posée par `VisaDgaStatutBadge`. L'aplat est réservé aux deux états qui tranchent —
 * actif, inactif — et le fond doux aux états de passage. « Validé » portait le ton
 * `primary`, c'est-à-dire le rouge de marque, alors que c'est une bonne nouvelle en
 * attente de la suivante.</p>
 */
export function StatusChip({ status }: { status: null | number }) {
  if (status == null) {
    return (
      <Chip size="sm" variant="soft">
        <Chip.Label>Inconnu</Chip.Label>
      </Chip>
    );
  }
  if (status === 4) {
    return (
      <Chip color="success" size="sm" variant="primary">
        <Chip.Label>Actif</Chip.Label>
      </Chip>
    );
  }
  if (status === 3) {
    return (
      <Chip color="success" size="sm" variant="soft">
        <Chip.Label>Validé</Chip.Label>
      </Chip>
    );
  }
  if (status === 5 || status === 0) {
    return (
      <Chip color="danger" size="sm" variant="primary">
        <Chip.Label>Inactif</Chip.Label>
      </Chip>
    );
  }
  // status 2 ou autre = en attente de validation
  return (
    <Chip color="warning" size="sm" variant="soft">
      <Chip.Label>En attente</Chip.Label>
    </Chip>
  );
}
