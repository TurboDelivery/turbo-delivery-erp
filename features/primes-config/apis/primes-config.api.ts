import { api } from '@/lib/api';
import { IPrimeConfig, IUpdatePrimeConfig } from '../types/primes-config.types';

// Backend : main-backend (service erp). /api/finance/prime-config (GET, PUT).
export const primesConfigAPI = {
  getConfig(): Promise<IPrimeConfig> {
    return api.request<IPrimeConfig>({
      endpoint: 'finance/prime-config',
      method: 'GET',
    });
  },

  updateConfig(dto: IUpdatePrimeConfig): Promise<IPrimeConfig> {
    return api.request<IPrimeConfig>({
      endpoint: 'finance/prime-config',
      method: 'PUT',
      data: dto,
    });
  },
};
