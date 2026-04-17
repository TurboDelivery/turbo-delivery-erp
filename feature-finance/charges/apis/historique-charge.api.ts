import { api } from '@/lib/api';
import { IHistoriqueCharge, IHistoriqueChargeParams } from '../types/historique-charge.type';
import { PaginatedResponse } from '@/types';

export interface IHistoriqueChargeAPI {
  obtenirHistoriqueCharges(params: IHistoriqueChargeParams): Promise<PaginatedResponse<IHistoriqueCharge>>;
}

export const historiqueChargeAPI: IHistoriqueChargeAPI = {
  obtenirHistoriqueCharges(params: IHistoriqueChargeParams): Promise<PaginatedResponse<IHistoriqueCharge>> {

    return api.request<PaginatedResponse<IHistoriqueCharge>>({
      endpoint: `/erp/historique-charges`,
      method: 'GET',
      searchParams: params,
    });
  },
};
