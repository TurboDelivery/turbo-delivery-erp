import type { LotStatut } from '../types/historique-creneaux.type';

export const LOT_STATUT_CONFIG: Record<LotStatut, { label: string; className: string }> = {
  EN_ATTENTE:        { label: 'En attente',        className: 'bg-gray-100 text-gray-600' },
  CALCUL_EN_COURS:   { label: 'Soumis DGA',        className: 'bg-blue-100 text-blue-700' },
  SOUMIS_PDG:        { label: 'Soumis PDG',        className: 'bg-indigo-100 text-indigo-700' },
  APPROUVE_PDG:      { label: 'Approuvé PDG',      className: 'bg-purple-100 text-purple-700' },
  PAIEMENT_EN_COURS: { label: 'Paiement en cours', className: 'bg-amber-100 text-amber-700' },
  SOLDE:             { label: 'Soldé',             className: 'bg-green-100 text-green-700' },
  REJETE:            { label: 'Rejeté',            className: 'bg-red-100 text-red-600' },
};

export function getLotStatutConfig(statut: string | null | undefined) {
  return LOT_STATUT_CONFIG[(statut as LotStatut)] ?? { label: statut ?? '—', className: 'bg-gray-100 text-gray-500' };
}
