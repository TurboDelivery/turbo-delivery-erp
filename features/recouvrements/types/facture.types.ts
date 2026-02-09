export interface IFacture {
  id: string;
  code: string;
  restaurantId: string;
  restaurantName: string;
  type: string;
  periodeDebut: string;
  periodeFin: string;
  montant: number;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFactureParams {
  restaurantId?: string;
  page?: number;
  size?: number;
  sort?: string;
  type?: string;
  statut?: string;
  periodeDebut?: Date;
  periodeFin?: Date;
}

export interface IFactureSummary {
  nombreFacturesARecouvrir: number;
  montantTotalARecouvrir: number;
  montantDejaRecouvre: number;
}

export interface IFactureSummaryParams {
  debut?: string;
  fin?: string;
}

// Type temporaire pour les détails de facture
// À remplacer par le type réel quand le backend sera prêt
export interface IFactureDetail extends IFacture {
  // Champs supplémentaires qui seront ajoutés plus tard
}

