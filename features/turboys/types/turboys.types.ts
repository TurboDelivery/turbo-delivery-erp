/**
 * V54 (2026-05) — Ajout de SUPERVISEUR_LIVREUR aligné sur la note de cadrage
 * DGA du 28/05/2026. Représente les superviseurs qui effectuent aussi des
 * livraisons et qui doivent être isolés de la paie hebdomadaire des
 * indépendants.
 */
export type TurboyType = 'INDEPENDANT' | 'JOURNALIER' | 'SUPERVISEUR_LIVREUR';

export interface ITurboy {
  id: string;
 
  nom: string;
  prenoms: string;
  telephone: string | null;
  avatarUrl: string | null;
  salaire?: number;
  email: string | null;
  birthDay: string | null;
  gender: 'HOMME' | 'FEMME';
  numeroCni: string | null;
  habitation: string | null;
  immatriculation: string | null;
  matricule: string | null;
  deleted: boolean;
  typeLivreur: TurboyType;
  cniUrlR: string | null;
  cniUrlV: string | null;
  contratUrl: string | null;
  vehiclePhotoUrl: string | null;
  typeDocument: string | null;
  typeVehicule: string | null;
  nomVehicule: string | null;
  telephoneCompte: string | null;
  status: number | null;
  commission: number | null;
  avenantUrls: string[] | null;
  type: string | null;
  // V48 (2026-05) — Enrichissements ERP (cf. V48 backend)
  ficheIdentificationUrl: string | null;
  numeroPersonneAContacter: string | null;
  permisConduire: boolean | null;

  // ─── M1 (2026-06) — Comptes & habilitations (CDC v1.5) ───────────────────
  cniStatut: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
  ficheStatut: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
  contratStatut: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
  cniMotifRefus: string | null;
  ficheMotifRefus: string | null;
  contratMotifRefus: string | null;
  sitePartnerId: string | null;
  deviceId: string | null;
  deviceLabel: string | null;
}

export interface ITurboyParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  typeLivreur?: TurboyType;
}

export interface TurboyListResponse {
  totalCount: number;
  journalierCount: number;
  independantCount: number;
  // V54 (2026-05) — Compteur de la nouvelle population SUPERVISEUR_LIVREUR.
  // Optionnel pour rester rétro-compat si l'API renvoie un payload ancien
  // sans ce champ (chaîne de déploiement back/front asynchrone).
  superviseurLivreurCount?: number;
  demandesCount: number;
  livreurs: import('@/types/general').PaginatedResponse<ITurboy>;
}

export interface IUpdateTurboyTypePayload {
  id: string;
  typeLivreur: TurboyType;
  salaire?: number; // Pour les journaliers
}
