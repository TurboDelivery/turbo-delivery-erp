import { RestaurantDefini } from '@/types/price-list';

export type RestaurantOption = {
  label: string;
  value: string;
};

export const toRestaurantOptions = (restaurants: RestaurantDefini[]): RestaurantOption[] => {
  return restaurants
    .map((restaurant) => ({
      label: restaurant.nomEtablissement,
      value: restaurant.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
