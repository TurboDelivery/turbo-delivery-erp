import type { PaginatedResponse } from '@/types';

export type StatutCaissier =
  | 'Versé au caissier'
  | 'En attente visa DGA'
  | 'Rejeté DGA'
  | 'Visé DGA'
  // SPEC-RECOUV-002 — orientation des fonds après visa (DG/DGA).
  | 'Orienté banque'
  | 'Conservé en caisse'
  | 'Clôturé';

export interface IFactureCaissier {
  id: string;
  numero: string;
  partenaire: string;
  montant: number;
  montantRecouvre: number | null;
  pourcentageRecouvre: number | null;
  cycle: string;
  emission: string;
  agent: string;
  statut: StatutCaissier;
  depotBanque: string | null;
}

export interface IFactureCaissierListResponse {
  factures: PaginatedResponse<IFactureCaissier>;
}

export interface ICaissierParams {
  // Backend ResponsableFinancierFactureResource.listFactures : sans `periode`
  // le serveur applique "mois" (mois courant) et masque les factures plus
  // anciennes. La caisse est un backlog (todo), pas un rapport mensuel — on
  // passe donc periode="cycle" (= DateRange null/null backend = aucun filtre
  // date) pour voir toutes les factures à traiter quel que soit leur mois.
  periode?: 'mois' | 'annee' | 'cycle' | 'plage';
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  size?: number;
}

/** Correspond à IAjouterPreuveDTO — le caissier ajoute la référence de la fiche de paiement */
export interface ICaissierConfirmationBody {
  reference: string;
}

/**
 * Correspond à FactureDepotBanqueRequestDto — SPEC-RECOUV-002 : dépôt enrichi.
 * Activable uniquement sur « Orienté banque ». Un versement = un bordereau.
 */
export interface IDepotBanqueCaissierBody {
  date: string; // ISO date yyyy-MM-dd ; ≥ date de visa
  numeroBordereau: string; // unique
  preuveBordereau: string; // scan du bordereau (data URL base64)
  banqueAgence: string;
  montantDepose: number; // = montant visé
}
