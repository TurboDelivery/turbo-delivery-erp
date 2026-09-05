'use client';

import { ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { useAbility } from '@/hooks/use-ability';
import { JournalPanel } from '@/features/reporting/components/journal-panel';
import { RapportPanel } from '@/features/reporting/components/rapport-panel';

export function ReportingContent() {
  const ability = useAbility();
  const [onglet, setOnglet] = useState('journal');
  if (!ability.can('read', 'Reporting')) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted">
        <AlertTriangle aria-hidden="true" className="size-8" />
        <p>Vous n&apos;avez pas accès au reporting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reporting &amp; historisation</h1>
        <p className="text-sm text-muted">
          Journal transverse horodaté et attribué (CDC RG-11) et rapport de présence par livreur (RG-21).
        </p>
      </div>

      {/*
       * Un groupe de bascules, et non des onglets. `Tabs.Indicator` — le trait qui marque
       * l'onglet actif — rend le `SharedElement` de react-aria, qui exige un conteneur
       * d'animation absent du projet : c'est lui qui a mis l'ecran Tickets a terre en
       * production. Sans lui, la barre d'onglets ne distingue plus l'actif que par une
       * nuance de gris. Un segmente le dit franchement, et il n'a rien a faire tomber.
       */}
      <ToggleButtonGroup
        onSelectionChange={(s) => {
          const v = Array.from(s)[0];
          if (v) setOnglet(String(v));
        }}
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        <ToggleButton id="journal">Journal d&apos;activité</ToggleButton>
        <ToggleButton id="rapport">Rapport livreur</ToggleButton>
      </ToggleButtonGroup>

      {onglet === 'journal' ? <JournalPanel /> : <RapportPanel />}
    </div>
  );
}
