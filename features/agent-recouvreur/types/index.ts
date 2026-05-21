import type { PaginatedResponse } from '@/types';

// "Acompte N" est un statut dynamique émis par le serveur (ex. "Acompte 1", "Acompte 2")
export type StatutAcompte = `Acompte ${number}`;

export type StatutAgentFacture =
  | 'Recouvrement'
  | 'Déposé partenaire'
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
  modePaiement?: 'Espèces' | 'Mobile Money' | 'Virement';
  referenceTransaction?: string; // Obligatoire si modePaiement ≠ Espèces
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
