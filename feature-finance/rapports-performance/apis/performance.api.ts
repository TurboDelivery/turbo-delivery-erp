import { apiClientHttp } from '@/lib/api-client-http';
import { IDashboardData, IPerformanceParams } from '@/feature-finance/rapports-performance/types/performance.type';

export interface IPerformanceAPI {
  obtenirPerformance(params: IPerformanceParams): Promise<IDashboardData>;
}

export const performanceAPI: IPerformanceAPI = {
  async obtenirPerformance(params: IPerformanceParams): Promise<IDashboardData> {
    const queryParams: Record<string, string> = {
      debut: params.debut.toISOString().split('T')[0],
      fin: params.fin.toISOString().split('T')[0],
    };

    if (params.restaurantId) {
      queryParams.restaurantId = params.restaurantId;
    }

    return await apiClientHttp.request<IDashboardData>({
      endpoint: `/api/erp/analytics/performance`,
      method: 'GET',
      params: queryParams,
    
    });
  },
};
