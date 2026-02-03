import { RestaurantsTable } from '@/components/finance/recouvrements/restaurants/restaurants-table';
import { getRestaurantDefined } from '@/src/price-list/price-list.action';

export default async function RecouvrementsPage() {
  const restaurants = await getRestaurantDefined();
  const restaurantOpts = restaurants.map((restaurant) => ({
    label: restaurant.nomEtablissement,
    value: restaurant.id,
  }));
  return (
    <>
      <RestaurantsTable restoOpts={restaurantOpts} />
    </>
  );
}
