import { apiClientHttp } from '@/lib/api-client-http';
import { IApprobationFinaleCreneau } from '../types/approbation-finale.type';

export async function getApprobationFinaleApi(creneauId?: string): Promise<IApprobationFinaleCreneau | null> {
  try {
    const id = creneauId ?? 'active';
    return await apiClientHttp.request<IApprobationFinaleCreneau>({
      endpoint: `/api/erp/creneaux/${id}/approbation-finale`,
      method: 'GET',
      service: 'erp',
    });
  } catch {
    return null;
  }
}

export async function approuverEtDeclencherWaveApi(creneauId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/erp/creneaux/${creneauId}/approbation-finale/approuver`,
    method: 'POST',
    service: 'erp',
  });
}

export async function rejeterApprobationFinaleApi(creneauId: string, motif: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/erp/creneaux/${creneauId}/approbation-finale/rejeter`,
    method: 'POST',
    service: 'erp',
    data: { motif },
  });
}
