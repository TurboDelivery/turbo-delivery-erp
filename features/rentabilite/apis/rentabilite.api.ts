import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { IRentabilite } from '../types/rentabilite.types';

// Backend : main-backend (service erp). GET /api/finance/rentabilite?dateArret=YYYY-MM-DD
export const rentabiliteAPI = {
  getRentabilite(dateArret?: string): Promise<IRentabilite> {
    return api.request<IRentabilite>({
      endpoint: 'finance/rentabilite',
      method: 'GET',
      searchParams: { dateArret: dateArret || undefined } as SearchParams,
    });
  },
};
