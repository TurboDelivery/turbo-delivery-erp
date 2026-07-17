import { apiClientHttp } from '@/lib/api-client-http';

/** Volume de données rattachées à une catégorie de dépense (comparaison avant fusion). */
export interface ICategorieDonneesRattachees {
  id: string;
  nomCategorie: string;
  description: string | null;
  chargesFixes: number;
  chargesVariables: number;
  depenses: number;
  total: number;
}

/** Compte les données rattachées à chaque catégorie (doublons) pour comparer avant fusion. */
export async function donneesRattacheesCategoriesRequest(
  ids: string[],
): Promise<ICategorieDonneesRattachees[]> {
  return await apiClientHttp.request<ICategorieDonneesRattachees[]>({
    endpoint: '/api/finance/categories/donnees-rattachees',
    method: 'POST',
    service: 'backend',
    data: { ids },
  });
}

/** Fusionne les catégories `supprimeIds` dans `gardeId` (réassigne les lignes puis supprime). */
export async function fusionnerCategoriesRequest(
  gardeId: string,
  supprimeIds: string[],
  userId: string,
): Promise<{ fusionnes: number; gardeId: string }> {
  return await apiClientHttp.request({
    endpoint: '/api/finance/categories/fusionner',
    method: 'POST',
    service: 'backend',
    data: { gardeId, supprimeIds },
    config: { headers: { 'X-User-Id': userId } },
  });
}
