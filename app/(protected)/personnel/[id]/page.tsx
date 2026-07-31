import FicheAgentContent from './content';

export default function FicheAgentPage({ params }: { params: { id: string } }) {
  return <FicheAgentContent employeId={params.id} />;
}
