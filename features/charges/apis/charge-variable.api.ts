import { api } from '@/lib/api';
import {
  IChargeVariable,
  IChargeVariableCreateDTO,
  IChargeVariableParams,
  IChargeVariableUpdateDTO,
  IWorkflowDecisionDto
} from '../types/charge-variable.type';
import { PaginatedResponse } from '@/types/general';

export interface IChargeVariableAPI {
  ajouterChargeVariable(data: IChargeVariableCreateDTO): Promise<IChargeVariable>;
  // 2026-05 (commit A) — userId optionnel propagé en header X-User-Id pour
  // persister charge_variables.creer_par_id côté backend. Permet à
  // CHARGE_REJETEE de cibler PRÉCISÉMENT le Comptable créateur au lieu de
  // broadcast à tous les Comptables (cf. ChargeVariableService.create).
  ajouterChargeVariableFormData(data: FormData, userId?: string): Promise<IChargeVariable>;
  modifierChargeVariable(id: string, data: IChargeVariableUpdateDTO): Promise<IChargeVariable>;
  modifierChargeVariableFormData(id: string, data: FormData, userId?: string): Promise<IChargeVariable>;
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

  ajouterChargeVariableFormData(data: FormData, userId?: string): Promise<IChargeVariable> {
    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
    // X-User-Id capture le Comptable créateur côté backend pour adresser les
    // notifs CHARGE_REJETEE individuellement (commit A 2026-05).
    if (userId) headers['X-User-Id'] = userId;
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables`,
      method: 'POST',
      data,
      config: { headers },
    });
  },

  modifierChargeVariable(id: string, data: IChargeVariableUpdateDTO): Promise<IChargeVariable> {
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}`,
      method: 'PUT',
      data,
    });
  },

  modifierChargeVariableFormData(id: string, data: FormData, userId?: string): Promise<IChargeVariable> {
    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
    // X-User-Id propagé aussi sur update : permet la bascule "re-soumission
    // après rejet" (commit B 2026-05) qui re-notifie le DGA/DG d'origine.
    if (userId) headers['X-User-Id'] = userId;
    return api.request<IChargeVariable>({
      endpoint: `/erp/charges-variables/${id}`,
      method: 'PUT',
      data,
      config: { headers },
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
    return api.request<PaginatedResponse<IChargeVariable>>({
      endpoint: `/erp/charges-variables/pagination`,
      method: 'GET',
      searchParams: params as Record<string, unknown>,
    });
  },
};
