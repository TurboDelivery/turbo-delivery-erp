export interface IPaiementStats {
  totalGlobal: number;
  aDecaisser: number;
  decaisse: number;
}

export interface IDecaissementStatsResponse {
  totalADecaisser: number;
  totalDecaisse: number;
}

// Legacy types — still referenced by apis/paiement.api.ts and queries/paiements.query.ts
export interface IPaiementParams {
  page?: number;
  size?: number;
  mois?: string;
  statut?: string;
}

export interface IPaiement {
  id: string;
  designation: string;
  montant: number;
}
