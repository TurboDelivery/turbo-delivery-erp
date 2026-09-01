import { Metadata } from 'next';
import EditContent from './edit-content';

export const metadata: Metadata = {
  title: 'Modifier le profil du coursier',
};

export default async function EditLivreurPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <EditContent id={params.id} />;
}
