'use client';

import { Chip } from '@heroui-v3/react';

import { DeductionStatusEnum, DeductionTypeEnum } from '@/features/personnel/types/deduction.types';
import {
  getDeductionStatusLabel,
  getDeductionStatusTon,
  getDeductionTypeLabel,
} from '@/features/personnel/utils/deduction.utils';

/**
 * Les pastilles d'une déduction, montées une fois pour le tableau et pour la carte
 * tactile — les deux en portaient leur copie, assemblée à la main autour d'un
 * `<span className="inline-flex rounded-full px-2 py-1 …">`.
 */

export function ChipTypeDeduction({ type }: { type: DeductionTypeEnum }) {
  return (
    <Chip size="sm" variant="soft">
      <Chip.Label>{getDeductionTypeLabel(type)}</Chip.Label>
    </Chip>
  );
}

export function ChipStatutDeduction({ statut }: { statut: DeductionStatusEnum }) {
  return (
    <Chip color={getDeductionStatusTon(statut)} size="sm" variant="soft">
      <Chip.Label>{getDeductionStatusLabel(statut)}</Chip.Label>
    </Chip>
  );
}
