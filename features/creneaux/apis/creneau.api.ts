import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types/general';
import { ICreneauTurboy, ICreneauStats, IStatistiqueJour, ICreneauParams, ICreneauAnalyseComparaison, ICreneauDashboard, ICreneauDashboardParams, ICreneauJourDetail, ICreneauActifVm } from '../types/creneau.types';

export async function getCreneauActifApi(): Promise<ICreneauActifVm | null> {
  try {
    return await apiClientHttp.request<ICreneauActifVm>({
      endpoint: '/api/creneaux/actif',
      method: 'GET',
    });
  } catch {
    return null;
  }
}

export async function getCreneauxListApi(params?: {
  page?: number;
  size?: number;
  lotStatut?: string;
}): Promise<PaginatedResponse<ICreneauActifVm> | null> {
  try {
    return await apiClientHttp.request<PaginatedResponse<ICreneauActifVm>>({
      endpoint: '/api/creneaux',
      method: 'GET',
      params: {
        page: String(params?.page ?? 0),
        size: String(params?.size ?? 20),
        ...(params?.lotStatut ? { lotStatut: params.lotStatut } : {}),
      },
    });
  } catch {
    return null;
  }
}

export interface ICreneauAPI {
  obtenirCreneauxSemaine(params?: ICreneauParams): Promise<PaginatedResponse<ICreneauTurboy>>;
  obtenirStats(params?: { semaine?: string }): Promise<ICreneauStats>;
  obtenirStatistiquesParJour(params?: { semaine?: string }): Promise<IStatistiqueJour[]>;
  obtenirStatAnalyseComparaison(params?: { mois?: string }): Promise<ICreneauAnalyseComparaison>;
  obtenirDashboard(params?: ICreneauDashboardParams): Promise<ICreneauDashboard>;
  obtenirDashboardRealite(params?: ICreneauDashboardParams): Promise<ICreneauDashboard>;
  justifierAbsence(id: string, body: { date: string; motif: string }): Promise<void>;
  accuserRetard(id: string, body: { date: string; motif: string }): Promise<void>;
  obtenirDetailJour(date: string): Promise<ICreneauJourDetail>;
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
      endpoint: '/erp/gestion-creneau/previsionnel',
      method: 'GET',
      searchParams: {
        page: Math.max(0, params?.page ?? 0),
        size: params?.size ?? 10,
        ...(params?.debut ? { debut: params.debut } : {}),
        ...(params?.search ? { keysearch: params.search } : {}),
      } as SearchParams,
    });
  },

  obtenirDashboardRealite(params?: ICreneauDashboardParams): Promise<ICreneauDashboard> {
    return api.request<ICreneauDashboard>({
      endpoint: '/erp/gestion-creneau/realite',
      method: 'GET',
      searchParams: {
        page: Math.max(0, params?.page ?? 0),
        size: params?.size ?? 10,
        ...(params?.debut ? { debut: params.debut } : {}),
        ...(params?.search ? { keysearch: params.search } : {}),
      } as SearchParams,
    });
  },

  justifierAbsence(id: string, body: { date: string; motif: string }): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/gestion-creneau/${id}/justifier-absence`,
      method: 'PATCH',
      data: body,
    });
  },

  accuserRetard(id: string, body: { date: string; motif: string }): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/gestion-creneau/${id}/accuser-retard`,
      method: 'PATCH',
      data: body,
    });
  },

  obtenirDetailJour(date: string): Promise<ICreneauJourDetail> {
    return api.request<ICreneauJourDetail>({
      endpoint: '/erp/gestion-creneau/presence-journaliere',
      method: 'GET',
      searchParams: { date } as SearchParams,
    });
  },
};
