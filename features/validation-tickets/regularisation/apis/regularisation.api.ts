import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { PaginatedResponse } from '@/types';
import { IRegularisationTicket, IRegularisationParams } from '@/features/validation-tickets/regularisation/types/regularisation.type';

export interface IRegularisationAPI {
  listerTickets(params: IRegularisationParams): Promise<PaginatedResponse<IRegularisationTicket>>;
  approuver(id: string): Promise<void>;
  rejeter(id: string): Promise<void>;
}

// TODO: remplacer les endpoints par les vraies URLs quand disponibles
export const regularisationAPI: IRegularisationAPI = {
  listerTickets(params: IRegularisationParams): Promise<PaginatedResponse<IRegularisationTicket>> {
    return api.request<PaginatedResponse<IRegularisationTicket>>({
      endpoint: `/erp/validation/regularisation`,
      method: 'GET',
      searchParams: {
        page:   params.page   ?? 0,
        size:   params.size   ?? 50,
        debut:  params.debut?.toISOString()?.split('T')?.[0],
        fin:    params.fin?.toISOString()?.split('T')?.[0],
        search: params.search,
      } as SearchParams,
    });
  },

  approuver(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/validation/regularisation/approve/${id}`,
      method: 'POST',
    });
  },

  rejeter(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/validation/regularisation/reject/${id}`,
      method: 'POST',
    });
  },
};
