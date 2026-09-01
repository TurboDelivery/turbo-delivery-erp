import { JourDetailContent } from '@/components/creneaux/jour/jour-detail-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détail de la journée',
  description: 'Détail des présences et absences par journée',
};

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  return <JourDetailContent date={params.date} />;
}
