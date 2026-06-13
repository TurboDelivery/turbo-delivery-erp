// Configuration paramétrable de la commission / prime hebdomadaire (CDC RG-18/19).

export type AssiettePrime = 'LIVRAISONS_BRUT' | 'COMMISSION_60';

export interface IPrimeConfig {
  /** Taux de commission de base (%) appliqué au brut. CDC = 60. */
  tauxCommission: number;
  /** Taux de la prime hebdomadaire (%). CDC = 10. */
  tauxPrime: number;
  /** Assiette de la prime : total des livraisons (brut) ou commission 60 %. */
  assiettePrime: AssiettePrime;
  /** Nb min de livraisons/semaine pour l'éligibilité (0 = désactivé). */
  seuilLivraisonsHebdo: number;
  /** Montant brut min/semaine pour l'éligibilité. */
  seuilMontantHebdo: number;
  /** Nb min de jours de présence/semaine pour l'éligibilité. */
  seuilPresenceJours: number;
  /** Nb de courses/jour pour qu'un jour soit « validé ». */
  seuilCoursesJour: number;
  /** Active/désactive globalement la prime. */
  primeActive: boolean;
}

export type IUpdatePrimeConfig = Partial<IPrimeConfig>;
