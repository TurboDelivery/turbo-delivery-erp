import { Ticket } from '@/types/bon-livraison.model';

export interface ITicketParams {
  page?: number;
  size?: number;
  restaurantId?: string;
  livreurId?: string;
  debut?: Date;
  fin?: Date;
  search?: string;
  tab?: 'tous' | 'termines' | 'attentes';
  livreur?: string;
}

export interface ILivreurSearchParams {
  livreurPage?: number;
  livreurPageSize?: number;
  livreur?: string; // search
  idLivreur?: string; // filtre par livreurId
  idRestaurant?: string;
  creneauDebut?: Date; // debut
  creneauFin?: Date; // fin
}

export interface ITicketsStats {
  revenus: number;
  tickets: number;
  livreurs: number;
  restaurants: number;
  totalCommissions: number;
}

export interface ILivreurStats {
  totalTickets: number;
  totalLivraisons: number;
  primeHebdo: boolean;
}

export interface newTicket extends Ticket {
  coutCommande: number;
}

export interface TicketsJour {
  jour: string;
  montantTotal: number;
  tickets: newTicket[];
}

export interface ILivreurTicket {
  id: string;
  livreur: string; // nom du livreur
  tickets: TicketsJour[];
  primeHebdo?:boolean
}
