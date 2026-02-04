import { RestaurantsTable } from '@/components/finance/recouvrements/restaurants/restaurants-table';
import { getRestaurantDefined } from '@/src/price-list/price-list.action';
import RecouvrementGraphs from '@/feature-finance/revenus/components/recouvrement/recouvrement';

export default async function RecouvrementsPage() {
  const restaurants = await getRestaurantDefined();
  const restaurantOpts = restaurants.map((restaurant) => ({
    label: restaurant.nomEtablissement,
    value: restaurant.id,
  }));
  return (
    <>
      <RecouvrementGraphs />
      <RestaurantsTable restoOpts={restaurantOpts} />
    </>
  );
}
