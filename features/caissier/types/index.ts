import type { PaginatedResponse } from '@/types';

export type StatutCaissier =
  | 'Versé au caissier'
  | 'En attente visa DGA'
  | 'Rejeté DGA'
  | 'Visé DGA'
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

/** Correspond à FactureDepotBanqueRequestDto — dépôt des fonds en banque (statut Visé DGA → Clôturé) */
export interface IDepotBanqueCaissierBody {
  date: string; // ISO date yyyy-MM-dd
}
