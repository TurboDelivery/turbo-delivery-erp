import { api } from '@/lib/api';
import {
  IChargeVariable,
  IChargeVariableCreateDTO,
  IChargeVariableUpdateDTO,
  IChargeVariableParams,
} from '../types/charge-variable.type';
import { PaginatedResponse } from '@/types/general';

export interface IChargeVariableAPI {
  ajouterChargeVariable(data: IChargeVariableCreateDTO): Promise<IChargeVariable>;
  ajouterChargeVariableFormData(data: FormData): Promise<IChargeVariable>;
  modifierChargeVariable(id: string, data: IChargeVariableUpdateDTO): Promise<IChargeVariable>;
  modifierChargeVariableFormData(id: string, data: FormData): Promise<IChargeVariable>;
  supprimerChargeVariable(id: string): Promise<void>;
  obtenirChargesVariablesPagination(params: IChargeVariableParams): Promise<PaginatedResponse<IChargeVariable>>;
}

export const chargeVariableAPI: IChargeVariableAPI = {
  ajouterChargeVariable(data: IChargeVariableCreateDTO): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables`,
      method: 'POST',
      data,
    });
  },

  ajouterChargeVariableFormData(data: FormData): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables`,
      method: 'POST',
      data,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    });
  },

  modifierChargeVariable(id: string, data: IChargeVariableUpdateDTO): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}`,
      method: 'PUT',
      data,
    });
  },

  modifierChargeVariableFormData(id: string, data: FormData): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}`,
      method: 'PUT',
      data,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    });
  },

  supprimerChargeVariable(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/charges-variables/${id}`,
      method: 'DELETE',
    });
  },

  obtenirChargesVariablesPagination(params: IChargeVariableParams): Promise<PaginatedResponse<IChargeVariable>> {
    const searchParams: Record<string, string> = {};
    if (params.page !== undefined) searchParams['page'] = String(params.page);
    if (params.size !== undefined) searchParams['size'] = String(params.size);
    if (params.designation) searchParams['designation'] = params.designation;
    if (params.statut) searchParams['statut'] = params.statut;
    if (params.cyclePaiement) searchParams['cyclePaiement'] = params.cyclePaiement;

    return api.request<PaginatedResponse<IChargeVariable>>({
      endpoint: `/erp/charges-variables/pagination`,
      method: 'GET',
      searchParams,
    });
  },
};
