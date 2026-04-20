import { Metadata } from 'next';
import CreateContent from './create-content';

export const metadata: Metadata = { title: 'Créer un restaurant' };

export default function CreateRestaurantPage() {
  return <CreateContent />;
}
