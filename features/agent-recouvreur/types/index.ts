import type { PaginatedResponse } from '@/types';

// "Acompte N" est un statut dynamique émis par le serveur (ex. "Acompte 1", "Acompte 2")
export type StatutAcompte = `Acompte ${number}`;

export type StatutAgentFacture =
  | 'Recouvrement'
  | 'En cours'           // backend alias
  | 'Déposé partenaire'
  | 'Preuve ajoutée'     // backend: preuve ajoutée
  | StatutAcompte
  | 'Soldé'
  | 'Versé au caissier'
  | 'En attente visa DGA'
  | 'Visé DGA'
  | 'Rejeté DGA'
  | 'Clôturé';

export type CycleFiltre = 'TOUT' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'QUINZAINE' | 'MENSUEL';

export interface IAgentFacture {
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
  statut: StatutAgentFacture;
}

export interface IAgentFactureStats {
  enAttente: number;
  avecAcompte: number;
  soldees: number;
  tauxRecouvrement: number;
}

export type IAgentFactureListResponse = PaginatedResponse<IAgentFacture>;

/**
 * Shape réelle retournée par GET /api/finance/agent-recouvreur/factures.
 *
 * <p>Le backend renvoie un {@code AgentRecouvreurFacturePageVm} qui est une
 * Page Spring "flat" — pas de wrap {stats, factures}. Les stats sont sur un
 * endpoint séparé : GET /factures/stats.</p>
 */
export type IAgentFactureApiResponse = IAgentFactureListResponse;

export interface IAgentFactureParams {
  restaurantId?: string;
  cycle?: CycleFiltre;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  page?: number;
  size?: number;
}

export interface IEncaissementBody {
  type: 'Acompte' | 'Solde';
  date: string;
  montant: number;
  preuve?: string;
  remarque?: string;
}

export interface IDepotPartenaireBody {
  date: string;
  montant: number;
  agent: string;
}

export interface IVersementCaissierBody {
  montant: number;
  date: string;
  commentaire?: string;
}

/** @deprecated Utilisez IVersementCaissierBody */
export type IVerserComptableBody = IVersementCaissierBody;
