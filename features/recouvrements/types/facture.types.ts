export interface IFacture {
  id: string;
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
