import { Metadata } from 'next';
import CreateContent from './create-content';

export const metadata: Metadata = { title: 'Créer un profil' };

export default function CreateTurboyPage() {
  return <CreateContent />;
}
