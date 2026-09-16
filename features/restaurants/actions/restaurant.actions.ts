'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { IRestaurant, IRestaurantParams, IRestaurantStatsParams, IRestaurantStatsResponse, IRestaurantStatusCounts, ResultatExportPartenaires } from '@/features/restaurants/types/restaurant.type';
import { compterParStatut, filtrerEtTrierRestaurants } from '@/features/restaurants/utils/restaurant-filtrage.utils';
import { PaginatedResponse } from '@/types/general';
import axios from 'axios';

// Base URL pour la pagination des restaurants
const RESTAURANT_PAGINATION_ENDPOINT = '/api/V1/turbo/restaurant/pagination';
const RESTAURANT_GET_ALL_ENDPOINT = '/api/V1/turbo/restaurant/get/all';
const RESTAURANT_DETAIL_ENDPOINT = '/api/V1/turbo/restaurant';
const RESTAURANT_STATS_ENDPOINT = '/api/V1/turbo/restaurant/stats';
const RESTAURANT_DELETE_ENDPOINT = '/api/V1/turbo/restaurant';

/**
 * Récupère la liste paginée des restaurants.
 *
 * <p><b>Workaround fusion V1+V2 :</b> l'endpoint GET /restaurant/pagination
 * (Page&lt;RestaurantVm&gt; Spring) n'a pas été migré dans main-backend lors de
 * la fusion. En attendant qu'il soit ajouté, on récupère la liste flat via
 * /restaurant/get/all puis on filtre + pagine côté Server Action. Acceptable
 * pour ~64 partenaires ; à remplacer par un vrai endpoint paginé côté backend
 * si ce nombre grossit.</p>
 */
export async function getRestaurantsPaginated(params: IRestaurantParams): Promise<PaginatedResponse<IRestaurant>> {
  try {
    // 1- récupère tous les restaurants (flat)
    const all = await apiClientHttp.request<IRestaurant[]>({
      endpoint: RESTAURANT_GET_ALL_ENDPOINT,
      method: 'GET',
      service: 'restaurant',
    });

    // 2- filtre et tri, par la MEME fonction que l'export : l'ecran et le fichier doivent
    //    montrer la meme population, sans quoi le fichier ment sans qu'on s'en apercoive.
    const filtered = filtrerEtTrierRestaurants(all ?? [], params);

    // 3- pagination
    const page = Math.max(0, params.page ?? 0);
    const limit = Math.max(1, params.limit ?? 10);
    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / limit));
    const start = page * limit;
    const content = filtered.slice(start, start + limit);

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: limit,
        offset: start,
        paged: true,
        unpaged: false,
        sort: { sorted: !!params.orderBy, empty: !params.orderBy, unsorted: !params.orderBy },
      },
      last: page >= totalPages - 1,
      totalElements,
      totalPages,
      size: limit,
      number: page,
      sort: { sorted: !!params.orderBy, empty: !params.orderBy, unsorted: !params.orderBy },
      first: page === 0,
      numberOfElements: content.length,
      empty: content.length === 0,
    };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

// Référence pour le futur endpoint backend paginé natif (à utiliser quand il sera ajouté).
void RESTAURANT_PAGINATION_ENDPOINT;

/**
 * Récupère les détails d'un restaurant par son ID.
 *
 * <p>Backend main-backend (post-fusion) : endpoint canonique
 * {@code GET /api/V1/turbo/restaurant/info/{id}} (RestaurantCatalogResource).
 * L'ancien chemin {@code /restaurant/{id}} n'est pas mappé en GET côté backend
 * (seul DELETE existe sur ce path) → 405.</p>
 */
export async function getRestaurantById(id: string): Promise<IRestaurant> {
  try {
    return await apiClientHttp.request<IRestaurant>({
      endpoint: `${RESTAURANT_DETAIL_ENDPOINT}/info/${id}`,
      method: 'GET',
      service: 'restaurant',
    });
  } catch (error) {
    console.error(`Error fetching restaurant ${id}:`, error);
    throw error;
  }
}

/**
 * Décrit un échec d'appel en une phrase qu'on peut lire dans un message d'interface.
 *
 * <p>« Erreur lors de l'exportation » n'apprenait rien. Pendant des mois, la cause réelle
 * était un 405 sur un endpoint qui n'existe pas, et rien à l'écran ne pouvait le dire.</p>
 */
function decrireEchec(erreur: unknown): string {
  if (axios.isAxiosError(erreur)) {
    const cible = `${erreur.config?.baseURL ?? ''}${erreur.config?.url ?? RESTAURANT_GET_ALL_ENDPOINT}`;
    return erreur.response?.status
      ? `HTTP ${erreur.response.status} sur GET ${cible}`
      : `${erreur.code ?? 'Erreur réseau'} sur GET ${cible}`;
  }
  return erreur instanceof Error ? erreur.message : String(erreur);
}

/**
 * Charge TOUS les partenaires qui correspondent aux filtres, pour le fichier exporté.
 *
 * <h3>Ce que cette fonction remplace</h3>
 * <p>Un appel à {@code GET /api/V1/turbo/restaurant/export}, un endpoint qui n'a jamais
 * existé : ce chemin tombe sur la route {@code DELETE /restaurant/&#123;id&#125;}, qui avale
 * « export » comme identifiant et répond 405. Le bouton n'a donc jamais rien exporté depuis
 * sa mise en ligne. Il n'y a pas d'endpoint à créer : la liste entière est déjà servie par
 * {@code /restaurant/get/all}, c'est ce que fait l'écran lui-même à chaque affichage.</p>
 *
 * <p>Pas de {@code page} ni de {@code limit} dans la signature, et c'est volontaire : on ne
 * peut pas exporter dix lignes par accident, même dans six mois.</p>
 */
export async function chargerPartenairesPourExport(
  params: Omit<IRestaurantParams, 'page' | 'limit'>,
): Promise<ResultatExportPartenaires> {
  try {
    const all = await apiClientHttp.request<IRestaurant[]>({
      endpoint: RESTAURANT_GET_ALL_ENDPOINT,
      method: 'GET',
      service: 'restaurant',
    });
    return { ok: true, lignes: filtrerEtTrierRestaurants(all ?? [], params) };
  } catch (erreur) {
    console.error('[export partenaires] echec du chargement', erreur);
    return { ok: false, motif: decrireEchec(erreur) };
  }
}

/**
 * Récupère les statistiques agrégées des partenaires selon les filtres actifs
 */
export async function getRestaurantStats(params: IRestaurantStatsParams): Promise<IRestaurantStatsResponse> {
  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.localisation) queryParams.localisation = params.localisation;
  if (params.email) queryParams.email = params.email;
  if (params.telephone) queryParams.telephone = params.telephone;
  if (params.commune) queryParams.commune = params.commune;
  if (params.methodRecouvrement) queryParams.methodRecouvrement = params.methodRecouvrement;

  return await apiClientHttp.request<IRestaurantStatsResponse>({
    endpoint: RESTAURANT_STATS_ENDPOINT,
    method: 'GET',
    params: queryParams,
    service: 'restaurant',
  });
}

/**
 * Supprime un partenaire en conservant l'historique des livraisons associées
 */
export async function deleteRestaurant(id: string): Promise<void> {
  await apiClientHttp.request<void>({
    endpoint: `${RESTAURANT_DELETE_ENDPOINT}/${id}`,
    method: 'DELETE',
    service: 'restaurant',
  });
}

/**
 * Supprime un partenaire et toutes ses données de livraison (suppression totale — irréversible)
 */
export async function deleteRestaurantForce(id: string): Promise<void> {
  await apiClientHttp.request<void>({
    endpoint: `${RESTAURANT_DELETE_ENDPOINT}/${id}/force`,
    method: 'DELETE',
    service: 'restaurant',
  });
}

/**
 * Active ou désactive un partenaire
 * activate=false → désactive (status=0, plus de nouvelles commandes)
 * activate=true  → réactive (status restauré)
 */
export async function toggleRestaurantStatus(id: string, activate: boolean): Promise<void> {
  await apiClientHttp.request<void>({
    endpoint: `${RESTAURANT_DELETE_ENDPOINT}/${id}/${activate ? 'activate' : 'deactivate'}`,
    method: 'PATCH',
    service: 'restaurant',
  });
}

/**
 * Compteurs par état du compte pour les cartes cliquables de la page Liste
 * (même source que la liste : /restaurant/get/all).
 */
export async function getRestaurantStatusCounts(): Promise<IRestaurantStatusCounts> {
  const all = await apiClientHttp.request<IRestaurant[]>({
    endpoint: RESTAURANT_GET_ALL_ENDPOINT,
    method: 'GET',
    service: 'restaurant',
  });
  // Vues non exclusives : un partenaire récemment créé est aussi compté dans « Validés ».
  return compterParStatut(all ?? []);
}

