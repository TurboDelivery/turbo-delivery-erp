import { JourDetailContent } from '@/components/creneaux/jour/jour-detail-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détail de la journée',
  description: 'Détail des présences et absences par journée',
};

interface PageProps {
  params: { date: string };
}

export default function Page({ params }: PageProps) {
  return <JourDetailContent date={params.date} />;
}
