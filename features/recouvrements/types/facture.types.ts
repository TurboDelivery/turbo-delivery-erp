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
  contestationActive: number;
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

// Ligne de détail d'une facture
export interface IFactureLigne {
  date: string;
  nombreLivraison: number;
  montantLivraison: number;
  montantCommandes: number;
  totalCommission: number;
}

// Période de facturation
export interface IFacturePeriode {
  debut: string;
  fin: string;
}

// Totaux de la facture
export interface IFactureTotaux {
  montantLivraison: number;
  montantCommandes: number;
  montantCommissions: number;
  factureAPayer: number;
}

// Détails complets d'une facture retournés par le backend
export interface IFactureDetail {
  code: string;
  restaurant: string;
  periode: IFacturePeriode;
  cyclePaiement: string;
  lignes: IFactureLigne[];
  totaux: IFactureTotaux;
}
