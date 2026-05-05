export interface ITicketV2 {
  id: string;
  ref: string;
  restaurant: string;
  amount: string;
  status: 'Authentifié' | 'En attente';
}

export interface ITicketsV2Params {
  page?: number;
  size?: number;
  debut?: Date;
  fin?: Date;
  search?: string;
}
