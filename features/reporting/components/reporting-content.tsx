'use client';

import { Tab, Tabs } from '@/components/heroui';
import { AlertTriangle } from 'lucide-react';

import { useAbility } from '@/hooks/use-ability';
import { JournalPanel } from '@/features/reporting/components/journal-panel';
import { RapportPanel } from '@/features/reporting/components/rapport-panel';

export function ReportingContent() {
  const ability = useAbility();
  if (!ability.can('read', 'Reporting')) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-default-400">
        <AlertTriangle className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès au reporting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">Reporting &amp; historisation</h1>
        <p className="text-sm text-default-500">
          Journal transverse horodaté et attribué (CDC RG-11) et rapport de présence par livreur (RG-21).
        </p>
      </div>

      <Tabs aria-label="Reporting" color="primary" variant="underlined">
        <Tab key="journal" title="Journal d'activité">
          <JournalPanel />
        </Tab>
        <Tab key="rapport" title="Rapport livreur">
          <RapportPanel />
        </Tab>
      </Tabs>
    </div>
  );
}
