import HistoriqueCreneauDetailContent from '@/features/validation-tickets/historique-creneaux/components/HistoriqueCreneauDetailContent';

export const dynamic = 'force-dynamic';

export default async function HistoriqueCreneauDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <HistoriqueCreneauDetailContent id={params.id} />;
}
