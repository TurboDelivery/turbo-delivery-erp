export interface IRecapPaiementLivreur {
  livreurId: string;
  nomLivreur: string;
  totalLivraison: number;
  commission: number;
  prime: number;
}

export interface IRecapPaiementLivreurSearchParams {
  debut?: Date; // debut
  fin?: Date; // fin
}
