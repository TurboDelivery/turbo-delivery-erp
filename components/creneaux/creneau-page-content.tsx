'use client';

import { CreneauHeader, CreneauTabs } from '@/components/creneaux/creneau-header';
import { CreneauPlanningTab } from '@/components/creneaux/tabs/creneau-planning-tab';
import { CreneauAnalyseTab } from '@/components/creneaux/tabs/creneau-analyse-tab';

export function CreneauPageContent() {
  return (
    <div className="space-y-6 ">
      <CreneauHeader />
      <CreneauTabs>
        <CreneauPlanningTab />
        <CreneauAnalyseTab />
      </CreneauTabs>
    </div>
  );
}
