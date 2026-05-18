import { Ticket } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';

export interface ITicketParams {
  page?: number;
  size?: number;
  restaurantId?: string;
  livreurId?: string;
  debut?: Date;
  fin?: Date;
  search?: string;
  tab?: 'tous' | 'termines' | 'attentes' | 'archives';
  livreur?: string;
}

export interface IArchivesParams {
  page?: number;
  size?: number;
  restaurantId?: string;
  livreurId?: string;
  debut?: Date;
  fin?: Date;
  deletedAtDebut?: Date;
  deletedAtFin?: Date;
  numero?: string;
}

export interface IArchiveBonLivraisonVm {
  commandeId: string;
  reference: string;
  livreurId: string;
  livreur: string;
  restaurantId: string;
  restaurant: string;
  coutLivraison: number;
  coutCommande: number;
  commission: number;
  date: string;
  heure: string;
  statut: string;
  statutControle?: StatutControle;
  zoneId?: string;
  nomZone?: string;
  typeCommission?: string;
  deletedAt?: string;
  deletedByUser?: { id: string; nom: string; prenoms: string; email: string; username: string } | null;
  createdByUser?: { id: string; nom: string; prenoms: string; email: string; username: string } | null;
  motifAnnulation?: string;
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
