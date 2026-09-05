import { DeductionStatusEnum, DeductionTypeEnum } from '@/features/personnel/types/deduction.types';

const TYPE_LABELS: Record<DeductionTypeEnum, string> = {
  [DeductionTypeEnum.AVANCE]: 'Avance',
  [DeductionTypeEnum.PRET]: 'Prêt',
  [DeductionTypeEnum.ABSENCE]: 'Absence',
  [DeductionTypeEnum.RETARD]: 'Retard',
};

/**
 * Le TYPE de déduction ne porte plus de couleur.
 *
 * <p>Avance en bleu, Prêt en violet, Absence en rouge, Retard en ambre : quatre teintes
 * de la palette Tailwind, sans variante sombre, pour une CATÉGORIE. Un prêt n'est pas
 * plus grave qu'une avance, et une absence n'est pas une erreur — le rouge le laissait
 * entendre sur chaque ligne. Le libellé dit déjà lequel c'est.</p>
 */

const STATUS_LABELS: Record<DeductionStatusEnum, string> = {
  [DeductionStatusEnum.PENDING]: 'En attente',
  [DeductionStatusEnum.PAID]: 'Payé',
  [DeductionStatusEnum.CANCELLED]: 'Annulé',
};

/**
 * Le STATUT, lui, garde un ton : c'est un état, pas une catégorie.
 *
 * <p>« En attente » est l'état NORMAL d'une déduction qui n'a pas encore atteint un
 * bulletin : l'ambre y annonçait un problème qui n'existe pas. « Annulé » reste rouge —
 * dans une série comptable, une ligne défaite est l'exception qu'on veut voir.</p>
 */
export type TonDeduction = 'danger' | 'default' | 'success';

const STATUS_TONS: Record<DeductionStatusEnum, TonDeduction> = {
  [DeductionStatusEnum.CANCELLED]: 'danger',
  [DeductionStatusEnum.PAID]: 'success',
  [DeductionStatusEnum.PENDING]: 'default',
};

export const getDeductionTypeLabel = (type: DeductionTypeEnum): string =>
  TYPE_LABELS[type] ?? type;



export const getDeductionStatusLabel = (status: DeductionStatusEnum): string =>
  STATUS_LABELS[status] ?? status;

export const getDeductionStatusTon = (status: DeductionStatusEnum): TonDeduction =>
  STATUS_TONS[status] ?? 'default';
