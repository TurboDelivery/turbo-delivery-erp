import { Metadata } from 'next';
import EditContent from './edit-content';

export const metadata: Metadata = {
  title: 'Modifier le profil du coursier',
};

export default function EditLivreurPage({ params }: { params: { id: string } }) {
  return <EditContent id={params.id} />;
}
