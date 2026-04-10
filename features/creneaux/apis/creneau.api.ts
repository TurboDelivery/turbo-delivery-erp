import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/general';
import { ICreneauTurboy, ICreneauStats, IStatistiqueJour, ICreneauParams, ICreneauAnalyseComparaison, ICreneauDashboard, ICreneauDashboardParams } from '../types/creneau.types';

export interface ICreneauAPI {
  obtenirCreneauxSemaine(params?: ICreneauParams): Promise<PaginatedResponse<ICreneauTurboy>>;
  obtenirStats(params?: { semaine?: string }): Promise<ICreneauStats>;
  obtenirStatistiquesParJour(params?: { semaine?: string }): Promise<IStatistiqueJour[]>;
  obtenirStatAnalyseComparaison(params?: { mois?: string }): Promise<ICreneauAnalyseComparaison>;
  obtenirDashboard(params?: ICreneauDashboardParams): Promise<ICreneauDashboard>;
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

  obtenirStatAnalyseComparaison(params?: { mois?: string }): Promise<ICreneauAnalyseComparaison> {
    return api.request<ICreneauAnalyseComparaison>({
      endpoint: '/erp/gestion-creneau/analytique',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenirDashboard(params?: ICreneauDashboardParams): Promise<ICreneauDashboard> {
    return api.request<ICreneauDashboard>({
      endpoint: '/erp/gestion-creneau/dashboard',
      method: 'GET',
      searchParams: {
        page: Math.max(0, params?.page ?? 0),
        size: params?.size ?? 10,
        ...(params?.debut ? { debut: params.debut } : {}),
      } as SearchParams,
    });
  },
};
