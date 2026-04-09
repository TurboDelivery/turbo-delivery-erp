import { CreneauPageContent } from '@/components/creneaux/creneau-page-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DETAIL CRENEAUX',
  description: 'Detail des creneaux hebdomadaires',
};

export default function Page() {
  return <CreneauPageContent />;
}
