import { getCreneauActifApi } from '@/features/creneaux/apis/creneau.api';
import { apiClientHttp } from '@/lib/api-client-http';
import {
  IFichePaie,
  IGrillePaiementCreneau,
  IGrillePaiementParams,
  IUpdateNumeroWaveParams,
} from '../types/grille-paiement.type';

export async function getGrillePaiementApi(
  _params?: IGrillePaiementParams,
): Promise<IGrillePaiementCreneau | null> {
  try {
    let creneauId = _params?.creneauId;
    if (!creneauId) {
      const creneau = await getCreneauActifApi();
      if (!creneau) return null;
      creneauId = creneau.id;
    }

    const data = await apiClientHttp.request<IGrillePaiementCreneau>({
      endpoint: `/api/creneaux/${creneauId}/grille-paiement`,
      method: 'GET',
      params: { page: String(_params?.page ?? 0), size: String(_params?.size ?? 20) },
    });

    return {
      ...data,
      lignes: {
        ...data.lignes,
        content: data.lignes.content.map((l) => ({ ...l, checked: false })),
      },
    };
  } catch {
    return null;
  }
}

export async function soumettrGrillePaiementApi(creneauId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/creneaux/${creneauId}/soumettre`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function validerLigneApi(lotId: string, turboyId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/valider-ligne/${turboyId}`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function getFichePaieApi(livreurId: string, lotId: string): Promise<IFichePaie> {
  return apiClientHttp.request<IFichePaie>({
    endpoint: `/api/erp/bon-livraison/livreurs/${livreurId}/montants-livraison`,
    method: 'GET',
    params: { lotId },
  });
}

export async function updateNumeroWaveApi(params: IUpdateNumeroWaveParams): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/creneaux/grille-paiement/turboy/${params.turboyId}/wave`,
    method: 'PATCH',
    data: { numeroWave: params.numeroWave },
  });
}
