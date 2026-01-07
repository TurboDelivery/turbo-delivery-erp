import Content from './content';
import { getAllDeliveryMan } from '@/src/actions/delivery-men.actions';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function Page() {
  const livreurs = await getAllDeliveryMan();
  const restaurants = await getAllRestaurants();

  return <Content restaurants={restaurants} livreurs={livreurs} />;
}
