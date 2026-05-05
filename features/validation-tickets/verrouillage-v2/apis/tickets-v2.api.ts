import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { PaginatedResponse } from '@/types';
import { ITicketV2, ITicketsV2Params } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';

export interface ITicketsV2API {
  listerTickets(params: ITicketsV2Params): Promise<PaginatedResponse<ITicketV2>>;
  verrouiller(id: string): Promise<void>;
  verrouillerTous(): Promise<void>;
  deverrouiller(id: string): Promise<void>;
}

// TODO: remplacer les endpoints par les vraies URLs quand disponibles
export const ticketsV2API: ITicketsV2API = {
  listerTickets(params: ITicketsV2Params): Promise<PaginatedResponse<ITicketV2>> {
    return api.request<PaginatedResponse<ITicketV2>>({
      endpoint: `/erp/validation/tickets-v2`,
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

  verrouiller(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/validation/tickets-v2/lock/${id}`,
      method: 'POST',
    });
  },

  verrouillerTous(): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/validation/tickets-v2/lock-all`,
      method: 'POST',
    });
  },

  deverrouiller(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/validation/tickets-v2/unlock/${id}`,
      method: 'POST',
    });
  },
};
