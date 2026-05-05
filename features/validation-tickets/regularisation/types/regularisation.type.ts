export interface IRegularisationTicket {
  id: string;
  ref: string;
  livreur: string;
  restaurant: string;
  montantCmd: string;
  montantLivraison: string;
  coutLivraison: string;
  date: string;
  time: string;
  motif: string;
}

export interface IRegularisationParams {
  page?: number;
  size?: number;
  debut?: Date;
  fin?: Date;
  search?: string;
}
