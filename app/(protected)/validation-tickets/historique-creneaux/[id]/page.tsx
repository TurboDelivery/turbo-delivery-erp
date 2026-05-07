import HistoriqueCreneauDetailContent from '@/features/validation-tickets/historique-creneaux/components/HistoriqueCreneauDetailContent';

export const dynamic = 'force-dynamic';

export default function HistoriqueCreneauDetailPage({ params }: { params: { id: string } }) {
  return <HistoriqueCreneauDetailContent id={params.id} />;
}
