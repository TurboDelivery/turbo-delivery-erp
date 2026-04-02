import { api } from '@/lib/api';
import {
  IChargeVariable,
  IChargeVariableCreateDTO,
  IChargeVariableUpdateDTO,
  IChargeVariableParams,
  IWorkflowDecisionDto,
} from '../types/charge-variable.type';
import { PaginatedResponse } from '@/types/general';

export interface IChargeVariableAPI {
  ajouterChargeVariable(data: IChargeVariableCreateDTO): Promise<IChargeVariable>;
  ajouterChargeVariableFormData(data: FormData): Promise<IChargeVariable>;
  modifierChargeVariable(id: string, data: IChargeVariableUpdateDTO): Promise<IChargeVariable>;
  modifierChargeVariableFormData(id: string, data: FormData): Promise<IChargeVariable>;
  validerDGAChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable>;
  approuverDGChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable>;
  rejeterDGAChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable>;
  rejeterDGChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable>;
  decaisserChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable>;
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

  validerDGAChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}/valider-dga`,
      method: 'POST',
      data: dto,
    });
  },

  approuverDGChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}/approuver-dg`,
      method: 'POST',
      data: dto,
    });
  },

  rejeterDGAChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}/rejeter-dga`,
      method: 'POST',
      data: dto,
    });
  },

  rejeterDGChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}/rejeter-dg`,
      method: 'POST',
      data: dto,
    });
  },

  decaisserChargeVariable(id: string, dto: IWorkflowDecisionDto): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}/decaisser`,
      method: 'POST',
      data: dto,
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
