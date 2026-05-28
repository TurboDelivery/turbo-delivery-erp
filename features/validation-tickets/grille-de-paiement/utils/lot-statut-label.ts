const LABELS: Record<string, string> = {
  CALCUL_EN_COURS: 'Soumis au DGA · Calcul en cours',
  SOUMIS_PDG: 'Soumis au PDG',
  APPROUVE_PDG: 'Approuvé par le PDG',
  PAIEMENT_EN_COURS: 'Paiement en cours',
  SOLDE: 'Soldé',
  REJETE: 'Rejeté par le DGA',
};

export function lotStatutLabel(statut: string | undefined): string | null {
  if (!statut) return null;
  return LABELS[statut] ?? statut;
}
