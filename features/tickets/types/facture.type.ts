export interface IRecapPaiementFacture {
  factureId: string;
  nomClient: string;
  totalFacture: number;
  commission: number;
  prime: number;
}

export interface IRecapPaiementFactureSearchParams {
  debut?: Date; // debut
  fin?: Date; // fin
}
