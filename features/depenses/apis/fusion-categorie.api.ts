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
  options: { codeSecret: string; descriptionFinale?: string; libelleFinal?: string },
): Promise<{ fusionnes: number; gardeId: string }> {
  return await apiClientHttp.request({
    endpoint: '/api/finance/categories/fusionner',
    method: 'POST',
    service: 'backend',
    data: { descriptionFinale: options.descriptionFinale, gardeId, libelleFinal: options.libelleFinal, supprimeIds },
    // Le code secret part en EN-TÊTE, jamais dans l'URL ni dans le corps journalisé : c'est
    // le même canal que la suppression d'une déduction, et le serveur le vérifie.
    config: { headers: { 'X-Code-Secret': options.codeSecret, 'X-User-Id': userId } },
  });
}

/** L'historique d'une catégorie tel que l'audit central le retient : création, renommages. */
export interface IEvenementCategorie {
  occurredAt: string;
  typeAction: string;
  /** Qui a agi. Vide sur les écritures antérieures à l'audit nominatif. */
  utilisateur: string | null;
  /** Les SEULS champs modifiés, avant puis après : un renommage y porte `nomCategorie`. */
  valeursAvant: Record<string, unknown> | null;
  valeursApres: Record<string, unknown> | null;
}

export async function historiqueCategorieRequest(id: string): Promise<IEvenementCategorie[]> {
  return await apiClientHttp.request<IEvenementCategorie[]>({
    endpoint: `/api/finance/categories/${id}/historique`,
    method: 'GET',
    service: 'backend',
  });
}

/**
 * UNE FUSION TELLE QUE LE JOURNAL LA RETIENT.
 *
 * <p>Les trois listes d'identifiants sont ce qui rend l'annulation possible : la fusion
 * déplaçait les lignes par un UPDATE en bloc, sans retenir lesquelles, donc après coup
 * les dépenses venues de la perdante étaient indiscernables de celles que la gardée
 * portait déjà.</p>
 */
export interface IFusionCategorie {
  id: string;
  categorieSourceId: string;
  categorieSourceNom: string;
  categorieSourceDescription: string | null;
  categorieCibleId: string;
  depensesIds: string[];
  chargesFixesIds: string[];
  chargesVariablesIds: string[];
  auteurId: string | null;
  createdAt: string;
  annuleeAt: string | null;
  annuleePar: string | null;
}

/** Le journal des fusions, le plus récent d'abord. */
export async function historiqueFusionsRequest(): Promise<IFusionCategorie[]> {
  return await apiClientHttp.request<IFusionCategorie[]>({
    endpoint: '/api/finance/categories/fusions',
    method: 'GET',
    service: 'backend',
  });
}

/**
 * Défait une fusion : rend les lignes retenues et rallume la catégorie éteinte.
 *
 * <p>⚠ Le serveur REFUSE une annulation partielle. Si une ligne a été reclassée depuis la
 * fusion, rien n'est modifié et le message dit combien de lignes sur combien. C'est
 * voulu : une annulation à moitié faite laisse deux catégories dont aucune ne décrit la
 * réalité.</p>
 *
 * <p>L'identifiant de l'auteur est EXIGÉ par la route, là où la fusion l'accepte absent :
 * une annulation déplace des lignes porteuses de montants.</p>
 */
export async function annulerFusionRequest(
  fusionId: string,
  userId: string,
): Promise<IFusionCategorie> {
  return await apiClientHttp.request<IFusionCategorie>({
    endpoint: `/api/finance/categories/fusions/${fusionId}/annuler`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}
