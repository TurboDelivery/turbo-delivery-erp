import { apiClientHttp } from '@/lib/api-client-http';
import { QuartierZone } from '@/types/models';

// M4 (RG-33) — quartiers servis par main-backend (service 'backend', /api/erp/**).
const QUARTIERS_ENDPOINT = '/api/erp/trafic/quartiers';

export async function getQuartiersRequest(): Promise<QuartierZone[]> {
  try {
    return await apiClientHttp.request<QuartierZone[]>({
      endpoint: QUARTIERS_ENDPOINT,
      method: 'GET',
      service: 'backend',
    });
  } catch {
    return [];
  }
}
