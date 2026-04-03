import { api } from '@/lib/api';
import { IDailyStatsParams, IDailyStatsResponse } from '@/features/analyse-rentabilite/types/daily-stats.type';
import { SearchParams } from 'ak-api-http';

export interface IDailyStatsAPI {
  obtenirDailyStats(params: IDailyStatsParams): Promise<IDailyStatsResponse>;
}

export const dailyStatsAPI: IDailyStatsAPI = {
  async obtenirDailyStats(params: IDailyStatsParams): Promise<IDailyStatsResponse> {
    return await api.request<IDailyStatsResponse>({
      endpoint: `/finance/daily/stats`,
      method: 'GET',
      searchParams: {
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });
  },
};
