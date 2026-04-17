import { api } from '@/lib/api';
import { IHistoriqueCharge, IHistoriqueChargeParams } from '../types/historique-charge.type';

export interface IHistoriqueChargeAPI {
  obtenirHistoriqueCharges(params: IHistoriqueChargeParams): Promise<IHistoriqueCharge[]>;
}

export const historiqueChargeAPI: IHistoriqueChargeAPI = {
  obtenirHistoriqueCharges(params: IHistoriqueChargeParams): Promise<IHistoriqueCharge[]> {

    return api.request<IHistoriqueCharge[]>({
      endpoint: `/erp/historique-charges`,
      method: 'GET',
      searchParams: params,
    });
  },
};
