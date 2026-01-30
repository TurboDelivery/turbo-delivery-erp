import { DepenseCreateDTO, DepenseUpdateDTO } from '@/features/depenses/schemas/depense.schema';
import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { IDepense, IDepensesParams, IDepenseStats, IDepenseStatsParams } from '@/features/depenses/types/depense.type';
import { PaginatedResponse } from '@/types/general';

export interface IDepenseAPI {
  obtenirTousDepenses(params: IDepensesParams): Promise<PaginatedResponse<IDepense>>;
  obtenirDepense(id: string): Promise<IDepense>;
  ajouterDepense(data: DepenseCreateDTO): Promise<IDepense>;
  modifierDepense(id: string, data: DepenseUpdateDTO): Promise<IDepense>;
  supprimerDepense(id: string): Promise<IDepense>;
  obtenirStatsDepenses(params: IDepenseStatsParams): Promise<IDepenseStats>;
}

export const depenseAPI: IDepenseAPI = {
  async obtenirTousDepenses(params: IDepensesParams): Promise<PaginatedResponse<IDepense>> {
    return await api.request<PaginatedResponse<IDepense>>({
      endpoint: `/finance/depenses/pagination`,
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  async obtenirDepense(id: string): Promise<IDepense> {
    return await api.request<IDepense>({
      endpoint: `/finance/depenses/${id}`,
      method: 'GET',
    });
  },

  ajouterDepense(data: DepenseCreateDTO): Promise<IDepense> {
    return api.request<IDepense>({
      endpoint: `/finance/depenses`,
      method: 'POST',
      data,
    });
  },

  modifierDepense(id: string, data: DepenseUpdateDTO): Promise<IDepense> {
    return api.request<IDepense>({
      endpoint: `/finance/depenses/${id}`,
      method: 'PUT',
      data,
    });
  },

  supprimerDepense(id: string): Promise<IDepense> {
    return api.request<IDepense>({
      endpoint: `/finance/depenses/${id}`,
      method: 'DELETE',
    });
  },

  obtenirStatsDepenses(params: IDepenseStatsParams): Promise<IDepenseStats> {
    // Supprimer les heures des dates pour éviter les problèmes de fuseau horaire
    return api.request<IDepenseStats>({
      endpoint: `/finance/depenses/stats`,
      method: 'GET',
      searchParams: {
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });
  },
};
