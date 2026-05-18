// ==================== Enum Statuts ====================
export type FactureStatut =
  | 'EMISE'
  | 'VALIDEE'
  | 'EN_RECOUVREMENT'
  | 'PREUVE_AJOUTEE'
  | 'DEPOT_PARTENAIRE'
  | 'DEPOT_BANQUE'
  | 'VISEE_DG'
  | 'PAYEE'
  | 'LITIGIEUSE';

// ==================== Facture ====================
export interface IResponsableFinancierFacture {
  id: string;
  code: string;
  restaurantId: string;
  restaurant: string;
  statut: FactureStatut | string;
  montant: number;
  montantRegle: number;
  restant: number;
  periodeDebut: string;
  periodeFin: string;
  cyclePaiement: string;
  agentRecouvrementId?: string;
  agentRecouvrementNom?: string;
  preuveUrl?: string;
  commentaireValidation?: string;
  depotPartenaireAt?: string;
  depotBanqueAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Wrapper paginé retourné par GET /api/finance/responsable-financier/factures
export interface IResponsableFinancierFactureListVm {
  content: IResponsableFinancierFacture[];
  totalElements: number;
  totalPages: number;
  number: number;     // page courante (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

// ==================== Agent ====================
export interface IResponsableFinancierAgent {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
}

// ==================== Statut VM (réponse des PATCH) ====================
export interface IResponsableFinancierFactureStatutVm {
  id: string;
  statut: string;
  message?: string;
}

// ==================== Recouvrement VM ====================
export interface IResponsableFinancierFactureRecouvrementVm {
  id: string;
  agentId: string;
  agentNom: string;
  statut: string;
}

// ==================== Paramètres de filtres ====================
export interface IResponsableFinancierFactureParams {
  periode?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  page?: number;
  size?: number;
}

// ==================== Request DTOs ====================
export interface IFactureValidationRequestDto {
  montantValide?: number;
  commentaire?: string;
}

export interface IFactureRecouvrementAssignRequestDto {
  agentId: string;
}

export interface IFacturePreuveRequestDto {
  preuveUrl: string;
  commentaire?: string;
}

export interface IFactureDepotPartenaireRequestDto {
  montantDepose: number;
  dateDepot: string;
  reference?: string;
}

export interface IFactureDepotBanqueRequestDto {
  montantDepose: number;
  dateDepot: string;
  reference?: string;
}
