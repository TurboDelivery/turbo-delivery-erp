import { Metadata } from 'next';
import Content from './content';
import NotFound from '@/app/not-found';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';

export const metadata: Metadata = {
  title: 'Restaurants',
};

export default async function Restaurants(props: { params: Promise<{ restaurant_id: string }> }) {
  const params = await props.params;
  const currentRestaurant = await getDetailRestaurant(params.restaurant_id);

  if (!currentRestaurant) {
    return <NotFound />;
  }

  return <Content restaurant={currentRestaurant} />;
}
