import { api } from '@/lib/api';
import { IChargeFixe, IChargeFixeCreateDTO, IChargeFixeUpdateDTO, IChargeFixeParams, IWorkflowDecisionDtoFixe } from '../types/charge-fixe.type';
import { PaginatedResponse } from '@/types/general';

export interface IChargeFixeAPI {
  ajouterChargeFixe(data: IChargeFixeCreateDTO): Promise<IChargeFixe>;
  modifierChargeFixe(id: string, data: IChargeFixeUpdateDTO): Promise<IChargeFixe>;
  supprimerChargeFixe(id: string): Promise<void>;
  obtenirChargesFixesPagination(params: IChargeFixeParams): Promise<PaginatedResponse<IChargeFixe>>;
  validerDGAChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  approuverDGChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  rejeterDGAChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  rejeterDGChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  decaisserChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
}

export const chargeFixeAPI: IChargeFixeAPI = {
  ajouterChargeFixe(data: IChargeFixeCreateDTO): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes`,
      method: 'POST',
      data,
    });
  },

  modifierChargeFixe(id: string, data: IChargeFixeUpdateDTO): Promise<IChargeFixe> {
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

  obtenirChargesFixesPagination(params: IChargeFixeParams): Promise<PaginatedResponse<IChargeFixe>> {
    const searchParams: Record<string, string> = {};
    if (params.page !== undefined) searchParams['page'] = String(params.page);
    if (params.size !== undefined) searchParams['size'] = String(params.size);
    if (params.designation) searchParams['designation'] = params.designation;
    if (params.statut) searchParams['statut'] = params.statut;

    return api.request<PaginatedResponse<IChargeFixe>>({
      endpoint: `/erp/charges-fixes/pagination`,
      method: 'GET',
      searchParams,
    });
  },

  validerDGAChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}/valider-dga`,
      method: 'POST',
      data: dto,
    });
  },

  approuverDGChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}/approuver-dg`,
      method: 'POST',
      data: dto,
    });
  },

  rejeterDGAChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}/rejeter-dga`,
      method: 'POST',
      data: dto,
    });
  },

  rejeterDGChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}/rejeter-dg`,
      method: 'POST',
      data: dto,
    });
  },

  decaisserChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}/payer`,
      method: 'PATCH',
    });
  },
};
