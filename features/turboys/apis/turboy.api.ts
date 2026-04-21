import { ITurboy, ITurboyParams, IUpdateTurboyTypePayload, TurboyListResponse } from '@/features/turboys/types/turboys.types';
import { apiClientHttp } from '@/lib/api-client-http';

export interface ITurboyAPI {
  obtenirTurboyParType(params: ITurboyParams): Promise<TurboyListResponse>;
  obtenirTurboy(id: string): Promise<ITurboy>;
  updateTurboyType(payload: IUpdateTurboyTypePayload): Promise<ITurboy>;
}

export const turboyAPI: ITurboyAPI = {
  async obtenirTurboyParType(params: ITurboyParams): Promise<TurboyListResponse> {
    return await apiClientHttp.request<TurboyListResponse>({
      endpoint: `/api/erp/livreur/parType`,
      method: 'GET',
      params: params,
    });
  },

  async obtenirTurboy(id: string): Promise<ITurboy> {
    return await apiClientHttp.request<ITurboy>({
      endpoint: `/api/erp/livreur/info/${id}`,
      method: 'GET',
      service: 'backend',
    });
  },

  async updateTurboyType(payload: IUpdateTurboyTypePayload): Promise<ITurboy> {
    return await apiClientHttp.request<ITurboy>({
      endpoint: `/api/erp/livreur/${payload.id}/type`,
      method: 'PATCH',
      data: payload,
    });
  },
};

