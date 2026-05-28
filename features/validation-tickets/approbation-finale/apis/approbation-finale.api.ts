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

export async function approuverEtDeclencherWaveApi(lotId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/approuver-dg`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function rejeterApprobationFinaleApi(lotId: string, motif: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/rejeter-dg`,
    method: 'POST',
    data: { commentaire: motif },
    config: { headers: { 'X-User-Id': userId } },
  });
}
