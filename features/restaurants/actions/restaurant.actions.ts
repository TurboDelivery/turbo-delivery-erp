'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { Restaurant, IRestaurantParams } from '@/features/restaurants/types/restaurant.type';
import { PaginatedResponse } from '@/types/general';

// Base URL pour la pagination des restaurants
const RESTAURANT_PAGINATION_ENDPOINT = '/api/V1/turbo/restaurant/pagination';
const RESTAURANT_DETAIL_ENDPOINT = '/api/V1/turbo/restaurant';

/**
 * Récupère la liste paginée des restaurants
 */
export async function getRestaurantsPaginated(params: IRestaurantParams): Promise<PaginatedResponse<Restaurant>> {
  try {
    // Construire les paramètres de requête
    const queryParams: Record<string, any> = {
      page: params.page,
      limit: params.limit,
    };

    // Ajouter le filtre de recherche si présent
    if (params.search) {
      queryParams.nomEtablissement = params.search;
    }

    return await apiClientHttp.request<PaginatedResponse<Restaurant>>({
      endpoint: RESTAURANT_PAGINATION_ENDPOINT,
      method: 'GET',
      params: queryParams,
      service: 'restaurant',
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

/**
 * Récupère les détails d'un restaurant par son ID
 */
export async function getRestaurantById(id: string): Promise<Restaurant> {
  try {
    return await apiClientHttp.request<Restaurant>({
      endpoint: `${RESTAURANT_DETAIL_ENDPOINT}/${id}`,
      method: 'GET',
      service: 'restaurant',
    });
  } catch (error) {
    console.error(`Error fetching restaurant ${id}:`, error);
    throw error;
  }
}


