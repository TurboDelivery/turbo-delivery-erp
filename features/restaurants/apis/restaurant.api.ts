import { IRestaurantParams, IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { PaginatedResponse } from '@/types/general';
import { apiClientHttp } from '@/lib/api-client-http';

export interface IRestaurantAPI {
  obtenirTousRestaurants(params: IRestaurantParams): Promise<PaginatedResponse<IRestaurant>>;
  obtenirRestaurant(id: string): Promise<IRestaurant>;
}

export const restaurantAPI: IRestaurantAPI = {
  async obtenirTousRestaurants(params: IRestaurantParams): Promise<PaginatedResponse<IRestaurant>> {
    return await apiClientHttp.request<PaginatedResponse<IRestaurant>>({
      endpoint: `/api/erp/restaurant`,
      method: 'GET',
      params: params,
      service: 'restaurant',
    });
  },

  async obtenirRestaurant(id: string): Promise<IRestaurant> {
    return await apiClientHttp.request<IRestaurant>({
      endpoint: `/api/erp/restaurant/${id}`,
      method: 'GET',
      service: 'restaurant',
    });
  },
};
