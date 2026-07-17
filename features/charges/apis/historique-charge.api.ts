import { api } from '@/lib/api';
import { IHistoriqueCharge, IHistoriqueChargeParams } from '../types/historique-charge.type';
import { PaginatedResponse } from '@/types';

export interface IHistoriqueChargeAPI {
  obtenirHistoriqueCharges(params: IHistoriqueChargeParams): Promise<PaginatedResponse<IHistoriqueCharge>>;
  obtenirActeurs(): Promise<string[]>;
}

export const historiqueChargeAPI: IHistoriqueChargeAPI = {
  obtenirHistoriqueCharges(params: IHistoriqueChargeParams): Promise<PaginatedResponse<IHistoriqueCharge>> {

    return api.request<PaginatedResponse<IHistoriqueCharge>>({
      endpoint: `/erp/historique-charges`,
      method: 'GET',
      searchParams: params,
    });
  },

  // Acteurs distincts (créateurs / valideurs / approbateurs) — filtre « par utilisateur » admin.
  obtenirActeurs(): Promise<string[]> {
    return api.request<string[]>({
      endpoint: `/erp/historique-charges/acteurs`,
      method: 'GET',
    });
  },
};
