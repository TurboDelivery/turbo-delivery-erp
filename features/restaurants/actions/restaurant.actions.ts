'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { IRestaurant, IRestaurantParams } from '@/features/restaurants/types/restaurant.type';
import { PaginatedResponse } from '@/types/general';
import axios from 'axios';
import { auth } from '@/auth';

// Base URL pour la pagination des restaurants
const RESTAURANT_PAGINATION_ENDPOINT = '/api/V1/turbo/restaurant/pagination';
const RESTAURANT_EXPORT_ENDPOINT = '/api/V1/turbo/restaurant/export';
const RESTAURANT_DETAIL_ENDPOINT = '/api/V1/turbo/restaurant';

/**
 * Récupère la liste paginée des restaurants
 */
export async function getRestaurantsPaginated(params: IRestaurantParams): Promise<PaginatedResponse<IRestaurant>> {
  try {
    const queryParams: Record<string, any> = {
      page: params.page,
      limit: params.limit,
    };

    // Champs de recherche spécifiques
    if (params.nomEtablissement || params.search) {
      queryParams.nomEtablissement = params.nomEtablissement || params.search;
    }
    if (params.localisation) queryParams.localisation = params.localisation;
    if (params.email) queryParams.email = params.email;
    if (params.telephone) queryParams.telephone = params.telephone;
    if (params.commune) queryParams.commune = params.commune;
    if (params.methodRecouvrement) queryParams.methodRecouvrement = params.methodRecouvrement;

    return await apiClientHttp.request<PaginatedResponse<IRestaurant>>({
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
export async function getRestaurantById(id: string): Promise<IRestaurant> {
  try {
    return await apiClientHttp.request<IRestaurant>({
      endpoint: `${RESTAURANT_DETAIL_ENDPOINT}/${id}`,
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
    const url = `${process.env.NEXT_PUBLIC_API_RESTAURANT_URL}${RESTAURANT_EXPORT_ENDPOINT}${qs ? `?${qs}` : ''}`;

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

