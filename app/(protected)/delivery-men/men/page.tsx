import { Metadata } from 'next';
import { getAllDemandeAssignations } from '@/src/actions/delivery-men.actions';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';
import Content from './content';

export const metadata: Metadata = {
  title: 'Coursiers',
};

export default async function MenPage() {
  const [demandes, restaurants] = await Promise.all([
    getAllDemandeAssignations(),
    allRestaurants(),
  ]);

  // Replis morts retires : les deux actions relevent desormais sur echec de lecture
  // et renvoient un tableau non nullable, l'exception court-circuite le ??.
  return (
    <Content
      demandes={demandes}
      restaurants={restaurants}
    />
  );
}
