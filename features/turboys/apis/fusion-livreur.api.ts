import { apiClientHttp } from '@/lib/api-client-http';

/** Volume de données rattachées à un livreur (comparaison avant fusion). */
export interface ILivreurDonneesRattachees {
  livreurId: string;
  nomComplet: string;
  email: string | null;
  telephone: string | null;
  avatarUrl: string | null;
  aPhoto: boolean;
  status: number | null;
  typeLivreur: string | null;
  assignation: string | null;
  tickets: number;
  courses: number;
  emplois: number;
  paies: number;
  comptesTransfert: number;
  incidents: number;
  clesActivation: number;
  total: number;
}

/** Compte les données rattachées à chaque livreur (doublons) pour comparer avant fusion. */
export async function donneesRattacheesRequest(ids: string[]): Promise<ILivreurDonneesRattachees[]> {
  return await apiClientHttp.request<ILivreurDonneesRattachees[]>({
    endpoint: '/api/erp/livreur/donnees-rattachees',
    method: 'POST',
    service: 'backend',
    data: { ids },
  });
}

/** Fusionne les comptes `supprimeIds` dans `gardeId` (réassigne les données puis désactive). */
export async function fusionnerLivreursRequest(
  gardeId: string,
  supprimeIds: string[],
  userId: string,
): Promise<{ fusionnes: number; gardeId: string }> {
  return await apiClientHttp.request({
    endpoint: '/api/erp/livreur/fusionner',
    method: 'POST',
    service: 'backend',
    data: { gardeId, supprimeIds },
    config: { headers: { 'X-User-Id': userId } },
  });
}
