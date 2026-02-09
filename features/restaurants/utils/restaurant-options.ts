import { RestaurantDefini } from '@/types/price-list';
import { Restaurant } from '@/features/restaurants/types/restaurant.type';

export type RestaurantOption = {
  label: string;
  value: string;
};

export const toRestaurantOptions = (restaurants: RestaurantDefini[] | Restaurant[]): RestaurantOption[] => {
  return restaurants
    .map((restaurant) => ({
      label: restaurant.nomEtablissement,
      value: restaurant.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
