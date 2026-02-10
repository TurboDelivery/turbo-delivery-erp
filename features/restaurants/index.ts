// Types
export type { IRestaurant, IRestaurantParams, IPicture, IOpeningHour } from './types/restaurant.type';

// APIs
export { restaurantAPI } from './apis/restaurant.api';
export type { IRestaurantAPI } from './apis/restaurant.api';

// Actions (Server)
export { getRestaurantsPaginated, getRestaurantById } from './actions/restaurant.actions';

// Filters
export { restaurantFiltersClient } from './filters/restaurant.filters';

// Queries
export { useRestaurantsListQuery, useRestaurantQuery, restaurantKeys } from './queries/restaurant-list.query';

// Hooks
export { useRestaurantFilters } from './hooks/use-restaurant-filters';
export { useRestaurantList } from './hooks/use-restaurant-list';
export { useRestaurantTable } from './hooks/use-restaurant-table';

// Utils
export { toRestaurantOptions } from './utils/restaurant-options';
export type { RestaurantOption } from './utils/restaurant-options';

