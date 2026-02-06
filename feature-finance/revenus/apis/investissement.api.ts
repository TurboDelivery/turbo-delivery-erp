import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { IInvestissement, IInvestissementParams } from '../types/revenus.types';
import { InvestissementCreateDTO, InvestissementUpdateDTO } from '../schemas/investissement.schema';
import { PaginatedResponse } from '@/types';

export interface IInvestissementAPI {
  obtenirTousInvestissements(params: IInvestissementParams): Promise<PaginatedResponse<IInvestissement>>;
  obtenirInvestissement(id: string): Promise<IInvestissement>;
  ajouterInvestissement(data: InvestissementCreateDTO): Promise<IInvestissement>;
  modifierInvestissement(id: string, data: InvestissementUpdateDTO): Promise<IInvestissement>;
  supprimerInvestissement(id: string): Promise<IInvestissement>;
}

export const investissementAPI: IInvestissementAPI = {
  async obtenirTousInvestissements(params: IInvestissementParams): Promise<PaginatedResponse<IInvestissement>> {
    return await api.request<PaginatedResponse<IInvestissement>>({
      endpoint: `/finance/investissements/pagination`,
      method: 'GET',
      searchParams: {
        ...params,
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });
  },

  async obtenirInvestissement(id: string): Promise<IInvestissement> {
    return await api.request<IInvestissement>({
      endpoint: `/finance/investissements/${id}`,
      method: 'GET',
    });
  },

  ajouterInvestissement(data: InvestissementCreateDTO): Promise<IInvestissement> {
    return api.request<IInvestissement>({
      endpoint: `/finance/investissements`,
      method: 'POST',
      data,
    });
  },

  modifierInvestissement(id: string, data: InvestissementUpdateDTO): Promise<IInvestissement> {
    return api.request<IInvestissement>({
      endpoint: `/finance/investissements/${id}`,
      method: 'PUT',
      data,
    });
  },

  supprimerInvestissement(id: string): Promise<IInvestissement> {
    return api.request<IInvestissement>({
      endpoint: `/finance/investissements/${id}`,
      method: 'DELETE',
    });
  },
};
