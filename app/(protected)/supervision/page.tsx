import { SupervisionContent } from './content';

// Écran temps réel : rien n'est pré-rendu à la construction.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <SupervisionContent />;
}
