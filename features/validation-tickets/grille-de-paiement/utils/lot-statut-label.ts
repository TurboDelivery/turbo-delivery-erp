// Aligné sur l'enum backend StatutLot. CALCUL_EN_COURS n'est PAS "soumis au
// DGA" : c'est l'état de préparation AVANT la soumission (étape 2 =
// soumettre-dga → SOUMIS_DGA). L'ancien libellé trompeur masquait le bug
// "Point 8 ne fonctionne".
const LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CALCUL_EN_COURS: 'En préparation · à soumettre au DGA',
  SOUMIS_DGA: 'Soumis au DGA',
  VALIDE_DGA: 'Visé par le DGA',
  APPROUVE_DG: 'Approuvé par le PDG',
  PAIEMENT_EN_COURS: 'Paiement en cours',
  SOLDE: 'Soldé',
  REJETE: 'Rejeté par le DGA',
};

export function lotStatutLabel(statut: string | undefined): string | null {
  if (!statut) return null;
  return LABELS[statut] ?? statut;
}
