import { getProfile } from '@/src/actions/users.actions';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { TicketTable } from '@/components/tickets/table';

export default async function TicketsPage() {
  const profile = await getProfile();
  const restaurants = await getAllRestaurants();

  return <TicketTable restaurants={restaurants} profile={profile} />;
}
