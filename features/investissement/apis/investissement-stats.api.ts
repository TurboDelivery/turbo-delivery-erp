import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import {
  IInvestissementStats,
  IInvestissementStatsSummary,
  IInvestissementStatsParams,
  IMonthlyInvestissementData,
} from '@/features/investissement/types/inestissement.types';

export interface IInvestissementStatsAPI {
  obtenirStatsInvestissements(params: IInvestissementStatsParams): Promise<IInvestissementStats>;
  obtenirStatsSummary(params: IInvestissementStatsParams): Promise<IInvestissementStatsSummary>;
  obtenirMonthlyData(params: IInvestissementStatsParams): Promise<IMonthlyInvestissementData[]>;
}

export const investissementStatsAPI: IInvestissementStatsAPI = {
  async obtenirStatsInvestissements(params: IInvestissementStatsParams): Promise<IInvestissementStats> {
    return await api.request<IInvestissementStats>({
      endpoint: `/finance/investissements/stats`,
      method: 'GET',
      searchParams: {
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });
  },

  async obtenirStatsSummary(params: IInvestissementStatsParams): Promise<IInvestissementStatsSummary> {
    const data = await api.request<IInvestissementStats>({
      endpoint: `/finance/investissements/stats`,
      method: 'GET',
      searchParams: {
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });

    // Retourner seulement le summary sans monthlyData
    return {
      totalInvestissement: data.totalInvestissement,
      totalRembourse: data.totalRembourse,
      totalARembourserCeMois: data.totalARembourserCeMois,
      montantRestant: data.montantRestant,
    };
  },

  async obtenirMonthlyData(params: IInvestissementStatsParams): Promise<IMonthlyInvestissementData[]> {
    const data = await api.request<IInvestissementStats>({
      endpoint: `/finance/investissements/stats`,
      method: 'GET',
      searchParams: {
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });

    // Retourner seulement monthlyData
    return data.monthlyData;
  },
};

