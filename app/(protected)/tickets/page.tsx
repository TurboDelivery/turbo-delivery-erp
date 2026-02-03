import Content from './content';
import { getProfile } from '@/src/actions/users.actions';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function TicketsPage() {
  const profile = await getProfile();
  const restaurants = await getAllRestaurants();

  return <Content restaurants={restaurants} profile={profile} />;
}
