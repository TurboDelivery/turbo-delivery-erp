import { DeductionStatusEnum, DeductionTypeEnum } from '@/features/personnel/types/deduction.types';

const TYPE_LABELS: Record<DeductionTypeEnum, string> = {
  [DeductionTypeEnum.AVANCE]: 'Avance',
  [DeductionTypeEnum.PRET]: 'Prêt',
  [DeductionTypeEnum.ABSENCE]: 'Absence',
  [DeductionTypeEnum.RETARD]: 'Retard',
};

const TYPE_CLASSNAMES: Record<DeductionTypeEnum, string> = {
  [DeductionTypeEnum.AVANCE]: 'bg-blue-100 text-blue-700',
  [DeductionTypeEnum.PRET]: 'bg-purple-100 text-purple-700',
  [DeductionTypeEnum.ABSENCE]: 'bg-red-100 text-red-700',
  [DeductionTypeEnum.RETARD]: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<DeductionStatusEnum, string> = {
  [DeductionStatusEnum.PENDING]: 'En attente',
  [DeductionStatusEnum.PAID]: 'Payé',
  [DeductionStatusEnum.CANCELLED]: 'Annulé',
};

const STATUS_CLASSNAMES: Record<DeductionStatusEnum, string> = {
  [DeductionStatusEnum.PENDING]: 'bg-amber-100 text-amber-700',
  [DeductionStatusEnum.PAID]: 'bg-green-100 text-green-700',
  [DeductionStatusEnum.CANCELLED]: 'bg-red-100 text-red-700',
};

export const getDeductionTypeLabel = (type: DeductionTypeEnum): string =>
  TYPE_LABELS[type] ?? type;

export const getDeductionTypeClassName = (type: DeductionTypeEnum): string =>
  TYPE_CLASSNAMES[type] ?? 'bg-gray-100 text-gray-700';

export const getDeductionStatusLabel = (status: DeductionStatusEnum): string =>
  STATUS_LABELS[status] ?? status;

export const getDeductionStatusClassName = (status: DeductionStatusEnum): string =>
  STATUS_CLASSNAMES[status] ?? 'bg-gray-100 text-gray-700';
