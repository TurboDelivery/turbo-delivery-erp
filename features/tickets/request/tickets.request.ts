import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { apiClientHttp } from '@/lib/api-client-http';
import { ILivreurSearchParams, ILivreurStats, ILivreurTicket, ITicketParams, ITicketsStats } from '@/features/tickets/types/tickets.type';
import { PaginatedResponse } from '@/types/general';

const BASE_URL = '/api/erp/bon-livraison';

const bonLivraisonEndpoints = {
  getBonLivraisonAll: {
    endpoint: `${BASE_URL}/tous`,
    method: 'GET',
  },
  bonLivraisonTerminers: { endpoint: `${BASE_URL}/tous-termines`, method: 'GET' },
  bonLivraisonTerminees: { endpoint: `${BASE_URL}/tous/termines`, method: 'GET' },
  bonLivraisonEnAttentes: { endpoint: `${BASE_URL}/tous-attentes`, method: 'GET' },
  listeLivreursTickets: { endpoint: `${BASE_URL}/livreurs/tickets`, method: 'GET' },
  stats: { endpoint: `${BASE_URL}/stats`, method: 'GET' },
  statsLivreur: { endpoint: `${BASE_URL}/prime-hebdo`, method: 'GET' },
  creerBonLivraison: { endpoint: `${BASE_URL}/create`, method: 'POST' },
  supprimerBonLivraison: { endpoint: `${BASE_URL}/supprimer`, method: 'DELETE' },
};

export async function getBonLivraisonRequest(params: ITicketParams): Promise<PaginatedResponse<BonLivraisonTerminee>> {
  return await apiClientHttp.request<PaginatedResponse<BonLivraisonTerminee>>({
    endpoint: bonLivraisonEndpoints.bonLivraisonTerminees.endpoint,
    method: bonLivraisonEndpoints.bonLivraisonTerminees.method,
    params: {
      page: params.page?.toString() || '0',
      size: params.size?.toString() || '10',
      restaurantId: params.restaurantId,
      livreurId: params.livreurId,
      debut: params.debut?.toISOString()?.split('T')?.[0],
      fin: params.fin?.toISOString()?.split('T')?.[0],
      search: params.search,
    },
  });
}

export async function getBonLivraisonStatsRequest(params: ITicketParams) {
  return await apiClientHttp.request<ITicketsStats>({
    endpoint: bonLivraisonEndpoints.stats.endpoint,
    method: bonLivraisonEndpoints.stats.method,
    params: {
      search: params.search,
      restaurantId: params.restaurantId?.trim() || undefined,
      livreurId: params.livreurId?.trim() || undefined,
      debut: params.debut?.toISOString()?.split('T')?.[0],
      fin: params.fin?.toISOString()?.split('T')?.[0],
    },
  });
}

export async function getLivreurStatsRequest(params: ITicketParams) {
  return await apiClientHttp.request<ILivreurStats[]>({
    endpoint: bonLivraisonEndpoints.statsLivreur.endpoint,
    method: bonLivraisonEndpoints.stats.method,
    params: {
      livreurId: params.livreurId?.trim() || undefined,
      debut: params.debut?.toISOString()?.split('T')?.[0],
      fin: params.fin?.toISOString()?.split('T')?.[0],
    },
  });
}

export async function getLivreursWithTicketsRequest(params: ILivreurSearchParams) {
  return await apiClientHttp.request<PaginatedResponse<ILivreurTicket>>({
    endpoint: bonLivraisonEndpoints.listeLivreursTickets.endpoint,
    method: bonLivraisonEndpoints.listeLivreursTickets.method,
    params: {
      search: params.livreur,
      restaurantId: params.idRestaurant,
      livreurId: params.idLivreur,
      debut: params.creneauDebut?.toISOString()?.split('T')?.[0],
      fin: params.creneauFin?.toISOString()?.split('T')?.[0],
      page: params.livreurPage?.toString() || 0,
      size: params.livreurPageSize?.toString() || 20,
    },
  });
}

export async function deleteBonLivraisonRequest(id: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `${BASE_URL}/${id}`,
    method: 'DELETE',
  });
}
