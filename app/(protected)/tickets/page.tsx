import Content from './content';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function Page() {
  const restaurants = await getAllRestaurants();

  return <Content restaurants={restaurants} />;
}
