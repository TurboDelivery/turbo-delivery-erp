import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { apiClientHttp } from '@/lib/api-client-http';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
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
