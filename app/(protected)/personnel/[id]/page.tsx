import FicheAgentContent from './content';

export default async function FicheAgentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <FicheAgentContent employeId={params.id} />;
}
