import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { apiClientHttp } from '@/lib/api-client-http';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { PaginatedResponse } from '@/types/general';
import { BonLivraisonTermineeSchema, BonLivraisonTermineeType } from '../schema/ticket.schema';

const BASE_URL = '/api/erp/bon-livraison';

const bonLivraisonEndpoints = {
  getBonLivraisonAll: {
    endpoint: `${BASE_URL}/tous`,
    method: 'GET',
    
  },
  bonLivraisonTerminers: { endpoint: `${BASE_URL}/tous-termines`, method: 'GET' },
  bonLivraisonTerminees: { endpoint: `${BASE_URL}/tous/termines`, method: 'GET' },
  bonLivraisonEnAttentes: { endpoint: `${BASE_URL}/tous-attentes`, method: 'GET' },
  creerBonLivraison: { endpoint: `${BASE_URL}/create`, method: 'POST' },
  supprimerBonLivraison: { endpoint: `${BASE_URL}/supprimer`, method: 'DELETE' },
};

export async function getBonLivraisonRequest(params: ITicketParams): Promise<PaginatedResponse<BonLivraisonTerminee>> {
  try {
    console.log('Fetching BonLivraison with params:', params);
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
  } catch (error) {
    return [] as any;
  }
}

export async function createBonLivraisonRequest(data: BonLivraisonTermineeType) {
  const validatedData = BonLivraisonTermineeSchema.parse(data);

  return apiClientHttp.request({
    endpoint: bonLivraisonEndpoints.creerBonLivraison.endpoint,
    method: bonLivraisonEndpoints.creerBonLivraison.method,
    data: validatedData,
  });
}
export async function deleteBonLivraisonRequest(commandeId: string) {
  return apiClientHttp.request({
    endpoint: `${bonLivraisonEndpoints.supprimerBonLivraison.endpoint}/${commandeId}`,
    method: bonLivraisonEndpoints.supprimerBonLivraison.method,
  });
}
