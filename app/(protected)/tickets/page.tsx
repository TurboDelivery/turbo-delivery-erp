import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { TicketPageClient } from '@/components/tickets/ticket-page-client';

export default async function TicketsPage() {
  const restaurants = await getAllRestaurants();
  return <TicketPageClient restaurants={restaurants} />;
}
