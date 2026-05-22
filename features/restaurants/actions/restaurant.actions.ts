'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { IRestaurant, IRestaurantParams, IRestaurantStatsParams, IRestaurantStatsResponse } from '@/features/restaurants/types/restaurant.type';
import { PaginatedResponse } from '@/types/general';
import axios from 'axios';
import { auth } from '@/auth';

// Base URL pour la pagination des restaurants
const RESTAURANT_PAGINATION_ENDPOINT = '/api/V1/turbo/restaurant/pagination';
const RESTAURANT_GET_ALL_ENDPOINT = '/api/V1/turbo/restaurant/get/all';
const RESTAURANT_EXPORT_ENDPOINT = '/api/V1/turbo/restaurant/export';
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

    // 2- filtre en mémoire selon les params
    const norm = (s?: string | null) => (s ?? '').toLowerCase().trim();
    const search = norm(params.nomEtablissement || params.search);
    const localisation = norm(params.localisation);
    const email = norm(params.email);
    const telephone = norm(params.telephone);
    const commune = norm(params.commune);
    const method = norm(params.methodRecouvrement);

    let filtered = (all ?? []).filter((r) => {
      if (search && !norm(r.nomEtablissement).includes(search)) return false;
      if (localisation && !norm(r.localisation).includes(localisation)) return false;
      if (email && !norm(r.email).includes(email)) return false;
      if (telephone && !norm(r.telephone).includes(telephone)) return false;
      if (commune && !norm(r.commune).includes(commune)) return false;
      if (method && norm(r.methodRecouvrement) !== method) return false;
      return true;
    });

    // 3- tri optionnel
    if (params.orderBy) {
      const key = params.orderBy as keyof IRestaurant;
      const dir = params.orderDirection === 'desc' ? -1 : 1;
      filtered = [...filtered].sort((a, b) => {
        const av = a?.[key];
        const bv = b?.[key];
        if (av == null && bv == null) return 0;
        if (av == null) return 1 * dir;
        if (bv == null) return -1 * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    // 4- pagination
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
 * Exporte la liste des restaurants filtrés en PDF (ArrayBuffer)
 */
export async function exportRestaurantsPDF(params: Omit<IRestaurantParams, 'page' | 'limit' | 'orderBy' | 'orderDirection'>): Promise<ArrayBuffer | null> {
  try {
    const session = await auth();
    const token = session?.user?.token;

    const queryParams: Record<string, string> = {};
    if (params.nomEtablissement || params.search) queryParams.nomEtablissement = params.nomEtablissement ?? params.search ?? '';
    if (params.localisation) queryParams.localisation = params.localisation;
    if (params.email) queryParams.email = params.email;
    if (params.telephone) queryParams.telephone = params.telephone;
    if (params.commune) queryParams.commune = params.commune;
    if (params.methodRecouvrement) queryParams.methodRecouvrement = params.methodRecouvrement;

    const qs = new URLSearchParams(queryParams).toString();
    // Note : la variable NEXT_PUBLIC_API_RESTAURANT_URL (avec RESTAURANT) n'a
    // jamais existé dans le .env — c'est un typo legacy. On utilise
    // NEXT_PUBLIC_API_RESTO_URL qui pointe sur backend-prod (post-fusion).
    // L'endpoint /restaurant/export n'existe pas encore côté main-backend,
    // donc l'export retournera 404 jusqu'à ce que l'endpoint soit ajouté
    // (TODO backend) — au moins ça ne crash plus avec `undefined/...`.
    const url = `${process.env.NEXT_PUBLIC_API_RESTO_URL ?? ''}${RESTAURANT_EXPORT_ENDPOINT}${qs ? `?${qs}` : ''}`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error exporting restaurants PDF:', error);
    return null;
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

