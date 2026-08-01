'use client';

import { FicheAgentView } from '@/features/personnel/components/fiche/fiche-agent-view';

export default function FicheAgentContent({ employeId }: { employeId: string }) {
  return (
    // Pleine largeur, comme la liste : la fiche agent affiche côte à côte le dossier et
    // l'historique mensuel de rémunération, qui a besoin de place. ContentAnimation pose
    // déjà le padding autour de la page.
    <div className="w-full">
      <FicheAgentView employeId={employeId} />
    </div>
  );
}
