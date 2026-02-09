import { IRestaurantParams, Restaurant } from '@/features/restaurants/types/restaurant.type';
import { PaginatedResponse } from '@/types/general';
import { apiClientHttp } from '@/lib/api-client-http';

export interface IRestaurantAPI {
  obtenirTousRestaurants(params: IRestaurantParams): Promise<PaginatedResponse<Restaurant>>;
  obtenirRestaurant(id: string): Promise<Restaurant>;
}

export const restaurantAPI: IRestaurantAPI = {
  async obtenirTousRestaurants(params: IRestaurantParams): Promise<PaginatedResponse<Restaurant>> {
    return await apiClientHttp.request<PaginatedResponse<Restaurant>>({
      endpoint: `/api/erp/restaurant`,
      method: 'GET',
      params: params,
      service: 'restaurant',
    });
  },

  async obtenirRestaurant(id: string): Promise<Restaurant> {
    return await apiClientHttp.request<Restaurant>({
      endpoint: `/api/erp/restaurant/${id}`,
      method: 'GET',
      service: 'restaurant',
    });
  },
};
