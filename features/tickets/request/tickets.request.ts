import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';
import { apiClientHttp } from '@/lib/api-client-http';
import { ILivreurSearchParams, ILivreurStats, ILivreurTicket, ITicketParams, ITicketsStats } from '@/features/tickets/types/tickets.type';
import { PaginatedResponse } from '@/types/general';

export interface ITicketsParStatutParams {
  statuts: StatutControle[];
  debut?: string;
  fin?: string;
  restaurantId?: string;
  search?: string;
  numero?: string;
  page?: number;
  size?: number;
}

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

export async function authentifierTicketRequest(ticketId: string, userId: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/${ticketId}/authentifier`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function validerV1Request(ticketId: string, userId: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/${ticketId}/valider-v1`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function validerV2Request(ticketId: string, userId: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/${ticketId}/valider-v2`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function validerV2EnMasseRequest(userId: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/valider-v2-en-masse`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function approuverTicketRequest(ticketId: string, userId: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/${ticketId}/approuver`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function rejeterFraudeRequest(ticketId: string, userId: string, motif: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/${ticketId}/rejeter-fraude`,
    method: 'POST',
    service: 'backend',
    data: { motif },
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function getCreneauTicketStatsRequest(creneauId?: string): Promise<import('@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type').CreneauTicketStatsVm> {
  return await apiClientHttp.request({
    endpoint: '/api/creneaux/tickets/stats',
    method: 'GET',
    params: creneauId ? { id: creneauId } : undefined,
  });
}

export async function listerTicketsParStatutRequest(params: ITicketsParStatutParams): Promise<PaginatedResponse<BonLivraisonTerminee>> {
  return await apiClientHttp.request<PaginatedResponse<BonLivraisonTerminee>>({
    endpoint: '/api/tickets',
    method: 'GET',
    params: {
      statuts: params.statuts[0],
      page: (params.page ?? 0).toString(),
      size: (params.size ?? 50).toString(),
      debut: params.debut || undefined,
      fin: params.fin || undefined,
      restaurantId: params.restaurantId || undefined,
      search: params.search || undefined,
      numero: params.numero || undefined,
    },
  });
}
