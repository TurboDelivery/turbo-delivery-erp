import type { PaginatedResponse } from '@/types';

export type StatutAgentFacture =
  | 'Recouvrement'
  | 'Déposé partenaire'
  | 'Soldé'
  | 'Visé DG'
  | 'Preuve ajoutée';

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

export interface IAgentFactureParams {
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

export interface IVerserComptableBody {
  montant: number;
  date: string;
}
