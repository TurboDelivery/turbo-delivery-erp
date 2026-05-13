import { notFound } from 'next/navigation';
import { MOCK_FACTURES } from '@/components/finance/responsable-financier/mock-data';
import FactureDetailView from '@/components/finance/responsable-financier/facture-detail-view';

interface Props {
  params: { id: string };
}

export default function FactureDetailPage({ params }: Props) {
  const facture = MOCK_FACTURES.find((f) => f.id === params.id);
  if (!facture) notFound();
  return <FactureDetailView facture={facture} />;
}
