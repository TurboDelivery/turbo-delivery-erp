import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { TicketTable } from '@/components/tickets/table';

export default async function TicketsPage() {
  const restaurants = await getAllRestaurants();

  return <TicketTable restaurants={restaurants} />;
}
