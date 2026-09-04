'use client';

import { Tabs, Tab } from '@/components/heroui';

export function CreneauHeader() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">DETAIL CRENEAUX</h1>
    </div>
  );
}

export function CreneauTabs({ children }: { children: [React.ReactNode, React.ReactNode] }) {
  return (
    <Tabs
      variant="light"
      size="md"
      defaultSelectedKey="planning"
      classNames={{
        tabList: 'bg-default-100 rounded-lg p-1',
        cursor: 'bg-surface shadow-xs',
        tab: 'px-4 py-2',
        panel: 'pt-4',
      }}
    >
      <Tab key="planning" title="Planning Hebdomadaire">
        {children[0]}
      </Tab>
      <Tab key="analyse" title="Analyse & Comparaison">
        {children[1]}
      </Tab>
    </Tabs>
  );
}
