import { Metadata } from 'next';
import NotFound from '@/app/not-found';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';
import EditContent from './edit-content';

export const metadata: Metadata = { title: 'Modifier le restaurant' };

export default async function EditRestaurantPage(props: { params: Promise<{ restaurant_id: string }> }) {
  const params = await props.params;
  const restaurant = await getDetailRestaurant(params.restaurant_id);

  if (!restaurant) {
    return <NotFound />;
  }

  return <EditContent restaurant={restaurant} />;
}
