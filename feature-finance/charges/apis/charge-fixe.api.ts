import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types';
import { IChargeFixe, IChargeFixeParams } from '../types/charge-fixe.type';
import { ChargeFixeCreateDTO, ChargeFixeUpdateDTO } from '../schemas/charge-fixe.schema';

export interface IChargeFixeAPI {
  ajouterChargeFixe(data: ChargeFixeCreateDTO): Promise<IChargeFixe>;
  modifierChargeFixe(id: string, data: ChargeFixeUpdateDTO): Promise<IChargeFixe>;
  supprimerChargeFixe(id: string): Promise<void>;
  obtenirChargesFixes(params: IChargeFixeParams): Promise<PaginatedResponse<IChargeFixe>>;
}

export const chargeFixeAPI: IChargeFixeAPI = {
  ajouterChargeFixe(data: ChargeFixeCreateDTO): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes`,
      method: 'POST',
      data,
    });
  },

  modifierChargeFixe(id: string, data: ChargeFixeUpdateDTO): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}`,
      method: 'PUT',
      data,
    });
  },

  supprimerChargeFixe(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/charges-fixes/${id}`,
      method: 'DELETE',
    });
  },

  obtenirChargesFixes(params: IChargeFixeParams): Promise<PaginatedResponse<IChargeFixe>> {
    const searchParams: Record<string, string> = {};
    if (params.designation) searchParams['designation'] = params.designation;
    if (typeof params.page === 'number') searchParams['page'] = String(params.page);
    if (typeof params.size === 'number') searchParams['size'] = String(params.size);

    return api.request<PaginatedResponse<IChargeFixe>>({
      endpoint: `/erp/charges-fixes/pagination`,
      method: 'GET',
      searchParams,
    });
  },
};
