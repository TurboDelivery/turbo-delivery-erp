import { apiClientHttp } from '@/lib/api-client-http';
import {
  IBilanAnnuelParams,
  IBilanAnnuelResponse,
} from '@/feature-finance/rapports-performance/types/bilan-annuel.type';

export const bilanAnnuelAPI = {
  async obtenirBilanAnnuel(params: IBilanAnnuelParams): Promise<IBilanAnnuelResponse> {
    return await apiClientHttp.request<IBilanAnnuelResponse>({
      endpoint: '/api/finance/dashboard/financier/annuel',
      method: 'GET',
      params: { annee: params.annee },
    });
  },
};
