'use client';

import { FicheAgentView } from '@/features/personnel/components/fiche/fiche-agent-view';

export default function FicheAgentContent({ employeId }: { employeId: string }) {
  return (
    <div className="container mx-auto p-6">
      <FicheAgentView employeId={employeId} />
    </div>
  );
}
