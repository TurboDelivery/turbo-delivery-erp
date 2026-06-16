import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types/general';
import { IJournalActivite, IJournalFiltre, IModuleCount, IRapportPresence } from '../types/reporting.types';

// Backend : main-backend, routes /api/erp/** (permitAll). Même client que la feature
// pointage M3 (apiClientHttp sans `service` → baseURL NEXT_PUBLIC_API_BACKEND_URL).

export const reportingAPI = {
  rechercherJournal(filtre: IJournalFiltre, size = 30): Promise<PaginatedResponse<IJournalActivite>> {
    return apiClientHttp.request<PaginatedResponse<IJournalActivite>>({
      endpoint: '/api/erp/journal-activite',
      method: 'GET',
      params: {
        page: String(filtre.page ?? 0),
        size: String(size),
        ...(filtre.module.length ? { module: filtre.module.join(',') } : {}),
        ...(filtre.debut ? { debut: filtre.debut } : {}),
        ...(filtre.fin ? { fin: filtre.fin } : {}),
        ...(filtre.keysearch ? { keysearch: filtre.keysearch } : {}),
      },
    });
  },

  compterModules(): Promise<IModuleCount[]> {
    return apiClientHttp.request<IModuleCount[]>({
      endpoint: '/api/erp/journal-activite/modules',
      method: 'GET',
    });
  },

  rapportPresence(livreurId: string, debut?: string, fin?: string): Promise<IRapportPresence> {
    return apiClientHttp.request<IRapportPresence>({
      endpoint: `/api/erp/gestion-creneau/${livreurId}/rapport`,
      method: 'GET',
      params: {
        ...(debut ? { debut } : {}),
        ...(fin ? { fin } : {}),
      },
    });
  },
};
