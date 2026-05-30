import { apiClientHttp } from '@/lib/api-client-http';

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
