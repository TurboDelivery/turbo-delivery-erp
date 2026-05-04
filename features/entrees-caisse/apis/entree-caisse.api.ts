import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { PaginatedResponse } from '@/types';
import {
  IEntreeCaisse,
  IEntreeCaisseParams,
  IEntreeCaissePaginatedParams,
} from '../types/entree-caisse.types';
import {
  EntreeCaisseCreateDTO,
  EntreeCaisseUpdateDTO,
} from '../schemas/entree-caisse.schema';

export interface IEntreeCaisseAPI {
  lister(params?: IEntreeCaisseParams): Promise<IEntreeCaisse[]>;
  listerPagine(params?: IEntreeCaissePaginatedParams): Promise<PaginatedResponse<IEntreeCaisse>>;
  obtenir(id: string): Promise<IEntreeCaisse>;
  creer(data: EntreeCaisseCreateDTO): Promise<IEntreeCaisse>;
  modifier(id: string, data: EntreeCaisseUpdateDTO): Promise<IEntreeCaisse>;
  supprimer(id: string): Promise<IEntreeCaisse>;
}

export const entreeCaisseAPI: IEntreeCaisseAPI = {
  lister(params?: IEntreeCaisseParams): Promise<IEntreeCaisse[]> {
    return api.request<IEntreeCaisse[]>({
      endpoint: 'finance/entrees-caisse',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  listerPagine(params?: IEntreeCaissePaginatedParams): Promise<PaginatedResponse<IEntreeCaisse>> {
    return api.request<PaginatedResponse<IEntreeCaisse>>({
      endpoint: 'finance/entrees-caisse/pagination',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenir(id: string): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: `finance/entrees-caisse/${id}`,
      method: 'GET',
    });
  },

  creer(data: EntreeCaisseCreateDTO): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: 'finance/entrees-caisse',
      method: 'POST',
      data,
    });
  },

  modifier(id: string, data: EntreeCaisseUpdateDTO): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: `finance/entrees-caisse/${id}`,
      method: 'PUT',
      data,
    });
  },

  supprimer(id: string): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: `finance/entrees-caisse/${id}`,
      method: 'DELETE',
    });
  },
};
