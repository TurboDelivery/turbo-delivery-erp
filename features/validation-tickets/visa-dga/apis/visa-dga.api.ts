import { apiClientHttp } from '@/lib/api-client-http';
import { IVisaDgaCreneau } from '../types/visa-dga.type';
import { MOCK_VISA_DGA } from '../mock/visa-dga.mock';

const USE_MOCK = true; // TODO: passer à false quand les vrais endpoints sont prêts

export async function getVisaDgaApi(creneauId?: string): Promise<IVisaDgaCreneau | null> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_VISA_DGA);
  }
  try {
    const id = creneauId ?? 'active';
    return await apiClientHttp.request<IVisaDgaCreneau>({
      endpoint: `/api/erp/creneaux/${id}/visa-dga`,
      method: 'GET',
      service: 'erp',
    });
  } catch {
    return null;
  }
}

export async function viserEtTransmettreApi(creneauId: string): Promise<void> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 800));
  }
  return apiClientHttp.request<void>({
    endpoint: `/api/erp/creneaux/${creneauId}/visa-dga/viser`,
    method: 'POST',
    service: 'erp',
  });
}

export async function rejeterEtRenvoyerApi(creneauId: string, motif: string): Promise<void> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 800));
  }
  return apiClientHttp.request<void>({
    endpoint: `/api/erp/creneaux/${creneauId}/visa-dga/rejeter`,
    method: 'POST',
    service: 'erp',
    data: { motif },
  });
}
