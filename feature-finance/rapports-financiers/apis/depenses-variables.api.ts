import { apiClientHttp } from '@/lib/api-client-http';
import {
  IDepenseVariableParams,
  IDepensesVariablesResponse,
} from '@/feature-finance/rapports-financiers/types/depenses-variables.type';

export const depensesVariablesAPI = {
  async obtenirDepensesVariables(
    params: IDepenseVariableParams,
  ): Promise<IDepensesVariablesResponse> {
    const queryParams: Record<string, string> = {
      page: (params.page ?? 0).toString(),
      size: (params.size ?? 20).toString(),
      debut: params.debut.toISOString().split('T')[0],
      typeDepense: 'VARIABLE',
    };

    if (params.fin) {
      queryParams.fin = params.fin.toISOString().split('T')[0];
    }

    return await apiClientHttp.request<IDepensesVariablesResponse>({
      endpoint: '/api/finance/depenses/by-type',
      method: 'GET',
      params: queryParams,
    });
  },
};
