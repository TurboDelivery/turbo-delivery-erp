import { ITurboyParams, ITurboy } from '@/features/turboys/types/turboys.types';
import { PaginatedResponse } from '@/types/general';
import { apiClientHttp } from '@/lib/api-client-http';

export interface ITurboyAPI {
  obtenirTurboyParType(params: ITurboyParams): Promise<PaginatedResponse<ITurboy>>;
  obtenirTurboy(id: string): Promise<ITurboy>;
}

export const turboyAPI: ITurboyAPI = {
  async obtenirTurboyParType(params: ITurboyParams): Promise<PaginatedResponse<ITurboy>> {
    return await apiClientHttp.request<PaginatedResponse<ITurboy>>({
      endpoint: `/api/erp/livreur/parType`,
      method: 'GET',
      params: params,
    });
  },

  async obtenirTurboy(id: string): Promise<ITurboy> {
    return await apiClientHttp.request<ITurboy>({
      endpoint: `/api/erp/livreur/${id}`,
      method: 'GET',
    });
  },
};

