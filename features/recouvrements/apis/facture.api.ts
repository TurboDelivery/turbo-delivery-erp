import { PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { IFacture, IFactureParams } from '../types/facture.types';

export interface IFactureApi {
  obtenirFactures(params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirFacture(id: string): Promise<IFacture>;
  obtenirFacturesParRestaurant(restaurantId?: string, params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
}

export const factureAPI: IFactureApi = {
  obtenirFactures(params?: IFactureParams): Promise<PaginatedResponse<IFacture>> {
    return api.request<PaginatedResponse<IFacture>>({
      endpoint: 'erp/factures',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenirFacture(id: string): Promise<IFacture> {
    return api.request<IFacture>({
      endpoint: `erp/factures/${id}`,
      method: 'GET',
    });
  },

  obtenirFacturesParRestaurant(restaurantId?: string, params?: IFactureParams): Promise<PaginatedResponse<IFacture>> {
    return api.request<PaginatedResponse<IFacture>>({
      endpoint: 'erp/factures',
      method: 'GET',
      searchParams: {
        ...params,
        ...(restaurantId && { restaurantId }),
      } as SearchParams,
    });
  },
};
