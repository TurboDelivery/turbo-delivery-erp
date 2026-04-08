import { api } from '@/lib/api';
import { IValidationStatsParams, IValidationStatsResponse } from '../types/validation-stats.type';

export const validationStatsAPI = {
  obtenirStats(params: IValidationStatsParams): Promise<IValidationStatsResponse> {
    const searchParams: Record<string, string> = {
      role: params.role,
    };
    if (params.debut) searchParams['debut'] = params.debut;
    if (params.fin) searchParams['fin'] = params.fin;

    return api.request<IValidationStatsResponse>({
      endpoint: `/erp/charges-fixes/workflow-stats`,
      method: 'GET',
      // searchParams,
    });
  },
};
