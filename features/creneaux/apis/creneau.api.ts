import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/general';
import { ICreneauTurboy, ICreneauStats, IStatistiqueJour, ICreneauParams } from '../types/creneau.types';

export interface ICreneauAPI {
  obtenirCreneauxSemaine(params?: ICreneauParams): Promise<PaginatedResponse<ICreneauTurboy>>;
  obtenirStats(params?: { semaine?: string }): Promise<ICreneauStats>;
  obtenirStatistiquesParJour(params?: { semaine?: string }): Promise<IStatistiqueJour[]>;
}

export const creneauAPI: ICreneauAPI = {
  obtenirCreneauxSemaine(params?: ICreneauParams): Promise<PaginatedResponse<ICreneauTurboy>> {
    return api.request<PaginatedResponse<ICreneauTurboy>>({
      endpoint: '/erp/gestion-creneau/bird/progression',
      method: 'GET',
      searchParams: {
        page: Math.max(0, params?.page ?? 0),
        size: params?.size ?? 10,
        ...(params?.search ? { keysearch: params.search } : {}),
      } as SearchParams,
    });
  },

  obtenirStats(params?: { semaine?: string }): Promise<ICreneauStats> {
    return api.request<ICreneauStats>({
      endpoint: '/erp/gestion-creneau/stats',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenirStatistiquesParJour(params?: { semaine?: string }): Promise<IStatistiqueJour[]> {
    return api.request<IStatistiqueJour[]>({
      endpoint: '/erp/gestion-creneau/stats/jour',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },
};
