import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types';
import { IChargeFixe, IChargeFixeParams, IChargeStats, IHistoriqueMasseSalariale, IWorkflowDecisionDtoFixe } from '../types/charge-fixe.type';
import { ChargeFixeCreateDTO, ChargeFixeUpdateDTO } from '../schemas/charge-fixe.schema';

export interface IChargeFixeAPI {
  ajouterChargeFixe(data: ChargeFixeCreateDTO): Promise<IChargeFixe>;
  modifierChargeFixe(id: string, data: ChargeFixeUpdateDTO): Promise<IChargeFixe>;
  supprimerChargeFixe(id: string): Promise<void>;
  supprimerDepenseDuMois(id: string, mois: string): Promise<void>;
  obtenirChargesFixes(params: IChargeFixeParams): Promise<PaginatedResponse<IChargeFixe>>;
  obtenirStatsChargesFixes(params?: { debut?: string; fin?: string }): Promise<IChargeStats>;
  validerDGAChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  approuverDGChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  rejeterDGAChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  rejeterDGChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  decaisserChargeFixe(id: string, dto: IWorkflowDecisionDtoFixe): Promise<IChargeFixe>;
  toggleEnableChargeFixe(id: string, enable: boolean, supprimerDepense: boolean): Promise<IChargeFixe>;
  obtenirHistoriqueMasseSalariale(mois: string): Promise<IHistoriqueMasseSalariale>;
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

  supprimerDepenseDuMois(id: string, mois: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/charges-fixes/${id}/depense`,
      method: 'DELETE',
      searchParams: { mois },
    });
  },

  obtenirChargesFixes(params: IChargeFixeParams): Promise<PaginatedResponse<IChargeFixe>> {
    return api.request<PaginatedResponse<IChargeFixe>>({
      endpoint: `/erp/charges-fixes/pagination`,
      method: 'GET',
      searchParams: params as Record<string, unknown>,
    });
  },

  obtenirStatsChargesFixes(params?: { debut?: string; fin?: string }): Promise<IChargeStats> {
    const searchParams: Record<string, string> = {};
    if (params?.debut) searchParams['debut'] = params.debut;
    if (params?.fin) searchParams['fin'] = params.fin;

    return api.request<IChargeStats>({
      endpoint: `/erp/charges-fixes/stats`,
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
      data: dto,
    });
  },

  toggleEnableChargeFixe(id: string, enable: boolean, supprimerDepense: boolean): Promise<IChargeFixe> {
    return api.request<IChargeFixe>({
      endpoint: `/erp/charges-fixes/${id}/enable`,
      method: 'PATCH',
      searchParams: {
        enable: String(enable),
        supprimerDepense: String(supprimerDepense),
      },
    });
  },

  obtenirHistoriqueMasseSalariale(mois: string): Promise<IHistoriqueMasseSalariale> {
    return api.request<IHistoriqueMasseSalariale>({
      endpoint: `/erp/charges-fixes/historique-masse-salariale`,
      method: 'GET',
      searchParams: { mois },
    });
  },
};
