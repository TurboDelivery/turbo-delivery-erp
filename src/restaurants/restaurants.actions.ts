'use server';

import { ActionResult, PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';
import { restaurantUpdateCommission } from '@/types/restaurants.model';
import { IRestaurant } from '@/features/restaurants';

// Configuration
const BASE_URL = '/api/erp/restaurant';
const BASE_URL_2 = '/api/erp/validation/restaurant';
const BASE_URL_3 = '/api/V1/turbo/restaurant';

const restaurantEndpoints = {
  base: {
    endpoint: BASE_URL,
    method: 'GET',
  },
  base_2: {
    endpoint: BASE_URL_2,
    method: 'GET',
  },
  // Backend canonique : GET /api/V1/turbo/restaurant/detail/erp/{id}
  // (l'ancien chemin /restaurant/{id}/detail n'existe pas dans main-backend)
  getDetailRestaurant: {
    endpoint: (idRestaurant: string) => `${BASE_URL_3}/detail/erp/${idRestaurant}`,
    method: 'GET',
  },
  getAll: {
    endpoint: (page: number) => `${BASE_URL_2}/validated/opsmanager/${page}`,
    method: 'GET',
  },
  // Backend ne fournit plus /validated/opsmanager (endpoint legacy non migré).
  // /restaurant/get/all retourne TOUS les restaurants (validés ou non) ; pour
  // les dropdowns/listes d'admin c'est acceptable. À remplacer si on a besoin
  // d'un vrai filtre validé-ops un jour.
  getAlls: {
    endpoint: `/api/V1/turbo/restaurant/get/all`,
    method: 'GET',
  },
  getAllValidated: {
    endpoint: (page: number) => `${BASE_URL_2}/validated/authservice/${page}`,
    method: 'GET',
  },
  getAllNoValidated: {
    endpoint: (page: number) => `${BASE_URL_2}/not/validated/${page}`,
    method: 'GET',
  },
  validateAuth: {
    endpoint: (idRestaurant: string) => `${BASE_URL_2}/validate/by/authservice/${idRestaurant}`,
    method: 'GET',
  },
  validateOps: {
    endpoint: (idRestaurant: string) => `${BASE_URL_2}/validate/by/opsmanager/${idRestaurant}`,
    method: 'GET',
  },
  info: {
    endpoint: (idRestaurant: string) => `${BASE_URL_2}/info/${idRestaurant}`,
    method: 'GET',
  },
  allRestaurants: {
    endpoint: `${BASE_URL}`,
    method: 'GET',
  },
  updateCommission: {
    endpoint: `${BASE_URL}/update-commission`,
    method: 'POST',
  },
};

export async function getDetailRestaurant(idRestaurant: string): Promise<IRestaurant | null> {
  try {
    return await apiClientHttp.request<IRestaurant>({
      endpoint: restaurantEndpoints.getDetailRestaurant.endpoint(idRestaurant),
      method: restaurantEndpoints.getDetailRestaurant.method,
      service: 'backend',
    });
  } catch (error) {
    // Le catch avalait TOUT : une panne de lecture (500, reseau, jeton expire) rendait
    // la meme valeur qu'un restaurant inexistant, et la fiche affichait "Page introuvable"
    // alors que le restaurant existe. Seul le 404 reste une absence legitime.
    const statutHttp = (error as { response?: { status?: number } })?.response?.status;
    if (statutHttp === 404) {
      return null;
    }
    throw error;
  }
}

export async function getRestaurants(page: number): Promise<PaginatedResponse<Restaurant> | null> {
  try {
    const data = await apiClientHttp.request<PaginatedResponse<Restaurant>>({
      endpoint: restaurantEndpoints.getAll.endpoint(page),
      method: restaurantEndpoints.getAll.method,
      service: 'erp',
    });
    return data;
  } catch (error) {
    // Une page de restaurants illisible devenait un `null` que l'appelant rend comme
    // une liste vide : l'operateur lisait "aucun restaurant" sur une base pleine.
    throw error;
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const data = await apiClientHttp.request({
      endpoint: restaurantEndpoints.getAlls.endpoint,
      method: restaurantEndpoints.getAlls.method,
      service: 'backend',
    });
    return data;
  } catch (error) {
    // Liste de reference des restaurants. Le tableau vide se confondait avec un vrai
    // catalogue vide : selecteurs de restaurant muets sur les ecrans Tickets, Commandes
    // et Frais de livraison, sans qu'aucun message n'indique la panne de lecture.
    throw error;
  }
}

// Helper : enrobe une List<Restaurant> en PaginatedResponse pour matcher
// l'interface attendue par useContentCtx (page-based). Pagination in-memory.
function wrapPaginated(all: Restaurant[], page: number, pageSize = 10): PaginatedResponse<Restaurant> {
  const totalElements = all.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const start = page * pageSize;
  const content = all.slice(start, start + pageSize);
  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize,
      offset: start,
      paged: true,
      unpaged: false,
      sort: { sorted: false, empty: true, unsorted: true },
    },
    last: page >= totalPages - 1,
    totalElements,
    totalPages,
    size: pageSize,
    number: page,
    sort: { sorted: false, empty: true, unsorted: true },
    first: page === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

/**
 * Backend post-fusion : les endpoints legacy
 * /api/erp/validation/restaurant/validated/authservice/{page} et
 * /api/erp/validation/restaurant/not/validated/{page} n'existent plus
 * (workflow de validation auth-service/ops-manager supprimé — tous les
 * restaurants en base sont considérés actifs). On fallback sur
 * /api/V1/turbo/restaurant/get/all et on pagine in-memory.
 *
 * Tant que le nouveau modèle n'expose pas de champ `status`, "validated"
 * = tous les restaurants existants.
 */
export async function getRestaurantsValidated(page: number): Promise<PaginatedResponse<Restaurant> | null> {
  try {
    const all = await apiClientHttp.request<Restaurant[]>({
      endpoint: `/api/V1/turbo/restaurant/get/all`,
      method: 'GET',
      service: 'backend',
    });
    return wrapPaginated(all ?? [], page);
  } catch (error) {
    // Panne de lecture rendue comme une absence de restaurants valides : l'ecran de
    // validation affichait une liste vide au lieu de signaler qu'il n'a rien pu lire.
    throw error;
  }
}

/**
 * Liste "not validated" : concept disparu côté backend post-fusion (tous les
 * restaurants en base sont considérés validés). On retourne une page vide
 * pour ne pas casser l'UI. À ré-implémenter le jour où le backend expose un
 * vrai champ `status`/`validatedByOps`.
 */
export async function getRestaurantsNoValidated(page: number): Promise<PaginatedResponse<Restaurant> | null> {
  return wrapPaginated([], page);
}

export async function validateRestaurant(id: string, validateBy: 'auth' | 'ops' | 'no-body'): Promise<ActionResult<Restaurant>> {
  if (validateBy == 'auth') {
    try {
      const data = await apiClientHttp.request<Restaurant>({
        endpoint: restaurantEndpoints.validateAuth.endpoint(id),
        method: restaurantEndpoints.validateAuth.method,
        service: 'erp',
      });
      return {
        status: 'success',
        message: 'Restaurant activé avec succès',
        data: data,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? "Erreur lors de l'activation du restaurant",
      };
    }
  }
  if (validateBy == 'ops') {
    try {
      const data = await apiClientHttp.request<Restaurant>({
        endpoint: restaurantEndpoints.validateOps.endpoint(id),
        method: restaurantEndpoints.validateOps.method,
        service: 'erp',
      });
      return {
        status: 'success',
        message: 'Restaurant activé avec succès',
        data: data,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? "Erreur lors de l'activation du restaurant",
      };
    }
  }
  return {
    status: 'error',
    message: 'Méthode de validation invalide',
  };
}

export async function allRestaurants(): Promise<Restaurant[]> {
  try {
    const data = await apiClientHttp.request<Restaurant[]>({
      endpoint: restaurantEndpoints.allRestaurants.endpoint,
      method: restaurantEndpoints.allRestaurants.method,
    });
    return data;
  } catch (error) {
    // Meme piege que getAllRestaurants : les pages Coursiers, Assignes, Demandes et
    // Birds recevaient une liste vide et affichaient les livreurs sans leur restaurant,
    // comme si aucun partenaire n'etait rattache.
    throw error;
  }
}

export async function updateCommission({ body }: { body: restaurantUpdateCommission }): Promise<ActionResult> {
  try {
    const data = await apiClientHttp.request<Restaurant[]>({
      endpoint: restaurantEndpoints.updateCommission.endpoint,
      method: restaurantEndpoints.updateCommission.method,
      data: body,
      service: 'backend',
    });
    return {
      data,
      status: 'success',
    };
  } catch (error: any) {
    return {
      message: 'Erreur lors du changement de mot de passe',
      status: 'error',
    };
  }
}
