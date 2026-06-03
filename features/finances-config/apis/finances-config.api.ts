import { api } from '@/lib/api';
import { IModuleConfig, IUpdateModuleConfig } from '../types/finances-config.types';

// Backend : main-backend (service erp). /api/finance/config (GET, PUT).
export const financesConfigAPI = {
  getConfig(): Promise<IModuleConfig> {
    return api.request<IModuleConfig>({
      endpoint: 'finance/config',
      method: 'GET',
    });
  },

  updateConfig(dto: IUpdateModuleConfig): Promise<IModuleConfig> {
    return api.request<IModuleConfig>({
      endpoint: 'finance/config',
      method: 'PUT',
      data: dto,
    });
  },
};
