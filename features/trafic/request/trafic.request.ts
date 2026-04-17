import { apiClientHttp } from '@/lib/api-client-http';
import { EMPTY_TRAFIC_RESPONSE, LivreurDisponible, TraficLivreursResponse } from '@/features/trafic/types/trafic.type';

const BASE_URL = '/api/erp';

const traficEndpoints = {
  getTraficLivreurs: { endpoint: `${BASE_URL}/trafic/livreur`, method: 'GET' as const },
  getTraficDelivers: { endpoint: `${BASE_URL}/livreur/statut/trafic`, method: 'GET' as const },
};

export async function getTraficLivreursRequest(): Promise<LivreurDisponible[]> {
  try {
    return await apiClientHttp.request<LivreurDisponible[]>({
      endpoint: traficEndpoints.getTraficLivreurs.endpoint,
      method: traficEndpoints.getTraficLivreurs.method,
      service: 'erp',
    });
  } catch {
    return [];
  }
}

export async function getTraficDeliversRequest(): Promise<TraficLivreursResponse> {
  try {
    return await apiClientHttp.request<TraficLivreursResponse>({
      endpoint: traficEndpoints.getTraficDelivers.endpoint,
      method: traficEndpoints.getTraficDelivers.method,
      service: 'backend',
    });
  } catch {
    return { ...EMPTY_TRAFIC_RESPONSE };
  }
}
