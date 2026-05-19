import { PaginatedResponse } from '@/types';

export type StatutFacture =
  | 'Soldé'
  | 'Acompte'
  | 'Déposé partenaire'
  | 'Recouvrement'
  | 'En cours'
  | 'Validé'
  | 'Preuve ajoutée'
  | 'Visé DG'
  | 'À valider';

export type CycleFiltre = 'TOUT' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'QUINZAINE' | 'MENSUEL';

export type CycleFacture = 'Journalier' | 'Hebdomadaire' | 'Mensuel';

// ─── Liste ────────────────────────────────────────────────────────────────────

export interface IFactureRF {
  id: string;
  numero: string;
  partenaire: string;
  montant: number;
  montantRecouvre: number | null;
  pourcentageRecouvre: number | null;
  cycle: string;
  emission: string;
  depotPartenaire: { date: string; agent: string } | null;
  depotBanque: string | null;
  agent: string;
  statut: StatutFacture;
  preuve?: string | null; // base64 data URL or HTTP URL returned by the API
}

// ─── Détail ───────────────────────────────────────────────────────────────────

export interface IHistoriqueStatut {
  label: string;
  date?: string | null;
  agent?: string | null;
  montant?: number | null;
  isCurrent?: boolean;
  isPending?: boolean;
}

export interface IFactureRFDetail extends IFactureRF {
  historique: IHistoriqueStatut[];
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface IFactureRFStats {
  totalFactures: number;
  totalMontant: number;
  nombrePartenaires: number;
  tauxRecouvrement: number;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

// Correspond à ResponsableFinancierAgentVm
export interface IAgentRecouvrement {
  id: string;
  nom: string;
  role: string;
}

// ─── VMs de réponse actions ──────────────────────────────────────────────────

// Correspond à ResponsableFinancierFactureStatutVm
export interface IFactureRFStatutVm {
  id: string;
  statut: StatutFacture;
}

// Correspond à ResponsableFinancierFactureRecouvrementVm
export interface IFactureRFRecouvrementVm {
  id: string;
  statut: StatutFacture;
  agent: string;
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface IFactureRFParams {
  periode?: 'mois' | 'annee' | 'cycle' | 'plage';
  cycle?: CycleFiltre;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  page?: number;
  size?: number;
}

// ─── DTOs (request bodies) ───────────────────────────────────────────────────

// FactureValidationRequestDto
export interface IValiderFactureDTO {
  cycle: CycleFacture;
}

// FactureRecouvrementAssignRequestDto
export interface ILancerRecouvrementDTO {
  agentId: string;
}

// FacturePreuveRequestDto
export interface IAjouterPreuveDTO {
  reference: string;
}

// FactureDepotPartenaireRequestDto
export interface IDepotPartenaireDTO {
  date: string; // ISO date
  agentId: string; // UUID
}

// FactureDepotBanqueRequestDto
export interface IDepotBanqueDTO {
  date: string; // ISO date
}

// ─── Réponse liste ────────────────────────────────────────────────────────────

// Correspond à ResponsableFinancierFactureListVm
export interface IFactureRFListResponse {
  stats: IFactureRFStats;
  factures: PaginatedResponse<IFactureRF>;
}

