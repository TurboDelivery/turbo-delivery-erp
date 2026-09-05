'use client';

import { ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { BarChart3, CalendarDays } from 'lucide-react';
import React from 'react';

/**
 * Le titre de la page des créneaux.
 *
 * <p>Il était rendu « DETAIL CRENEAUX » en capitales et en ROUGE DE MARQUE. Le rouge de
 * cet ERP dit « ceci appelle une action » ; un titre de page n'en appelle aucune. Et les
 * capitales sans accents faisaient lire « creneaux » à voix haute aux lecteurs d'écran.</p>
 */
export function CreneauHeader() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold text-foreground">Détail des créneaux</h1>
      <p className="text-sm text-muted">
        Planning de la semaine, puis comparaison des taux de présence.
      </p>
    </div>
  );
}

const ONGLETS = [
  { icone: CalendarDays, id: 'planning', libelle: 'Planning hebdomadaire' },
  { icone: BarChart3, id: 'analyse', libelle: 'Analyse et comparaison' },
] as const;

/**
 * Les deux onglets de la page.
 *
 * <p>`ToggleButtonGroup` et non `Tabs` : `Tabs.Indicator` de la v3 fait tomber la page, et
 * sans lui les onglets ne distinguent l'actif que par une nuance de gris.</p>
 *
 * <p>Les deux panneaux restent MONTÉS, cachés par `hidden` : l'ancien `Tabs` démontait le
 * panneau inactif, si bien que revenir sur « Planning » relançait la requête de la semaine
 * et repartait d'un écran de chargement.</p>
 */
export function CreneauTabs({ children }: { children: [React.ReactNode, React.ReactNode] }) {
  const [onglet, setOnglet] = React.useState<string>('planning');

  return (
    <div className="space-y-4">
      <ToggleButtonGroup
        className="flex-wrap"
        onSelectionChange={(sel) => setOnglet(String(Array.from(sel)[0] ?? 'planning'))}
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        {ONGLETS.map((o) => (
          <ToggleButton id={o.id} key={o.id}>
            <o.icone aria-hidden="true" className="size-4" />
            {o.libelle}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <div hidden={onglet !== 'planning'}>{children[0]}</div>
      <div hidden={onglet !== 'analyse'}>{children[1]}</div>
    </div>
  );
}
