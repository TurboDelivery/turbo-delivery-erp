export type LotStatut =
  | 'EN_ATTENTE'
  | 'CALCUL_EN_COURS'
  | 'SOUMIS_PDG'
  | 'APPROUVE_PDG'
  | 'PAIEMENT_EN_COURS'
  | 'SOLDE'
  | 'REJETE';

export interface IHistoriqueCreneau {
  id: string;
  code: string;
  periodeDebut: string;
  periodeFin: string;
  livreurs: number;
  tickets: number;
  nbTicketsPending: number;
  netFcfa: number;
  soumisLe: string;
  soumisParNom: string;
  statut: LotStatut;
  commentaire?: string;
}

export interface IHistoriqueCreneauxStats {
  total: number;
  payes: number;
  enRegularisation: number;
  rejets: number;
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export type StatutLivreurDetail = 'OK' | 'REJETE' | 'ATTENTE';
export type TimelineEventType = 'creation' | 'soumission' | 'rejet' | 'renvoi' | 'validation' | 'paiement';

export interface ICreneauDetailLivreur {
  id: string;
  nom: string;
  code: string;
  tickets: number;
  brut: number;
  taux: number;
  net: number;
  statut: StatutLivreurDetail;
}

export interface ICreneauTimelineEvent {
  id: string;
  titre: string;
  date: string;
  acteurNom: string;
  acteurRole: string;
  type: TimelineEventType;
  commentaire?: string;
}

export interface ICreneauDetail {
  id: string;
  code: string;
  periodeDebut: string;
  periodeFin: string;
  statut: LotStatut;
  soumisLe: string;
  soumisParNom: string;
  derniereAction: string;
  motifRegularisation?: string;
  kpi: {
    livreurs: number;
    tickets: number;
    totalBrut: number;
    totalNet: number;
  };
  livreurs: ICreneauDetailLivreur[];
  timeline: ICreneauTimelineEvent[];
}
