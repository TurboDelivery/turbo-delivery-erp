import { BonLivraisonTerminee } from "@/types/bon-livraison.model";

export interface ITicketParams {
  page?: number;
  size?: number;
  restaurantId?: string;
  livreurId?: string;
  debut?:Date,
  fin?:Date,
  search?: string;
  tab?: 'tous' | 'termines' | 'attentes';
  livreur?: string;
}
interface ITicketResponse {
  data: BonLivraisonTerminee[];
  total: number;
}
