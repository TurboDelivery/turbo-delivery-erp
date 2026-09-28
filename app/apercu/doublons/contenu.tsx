'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DoublonsView } from '@/components/bdd-clients/doublons/doublons-view';
import {
  bddClientsKeys,
  type IDoublon,
  type ILigneJournalFusion,
} from '@/features/bdd-clients';

/**
 * Le banc des DOUBLONS.
 *
 * <p>Ce qu'on vient regarder : que l'arbitrage se lise sans effort — quelle fiche garder,
 * combien de commandes bougent — et que rien ne soit pré-coché sur un geste qui déplace
 * l'historique de quelqu'un. Puis le journal, et l'annulation qui en dépend.</p>
 *
 * <p>⚠ Les `refetchOn*` sont coupés, pas le `staleTime` : les hooks des doublons posent
 * `staleTime: 0` exprès, et sans ces drapeaux la donnée semée repartirait au réseau.</p>
 */

const GROUPES: IDoublon[] = [
  {
    fiches: [
      {
        derniere: '2026-09-27T20:10:00Z',
        id: 'd1',
        nbCaptures: 12,
        nom: 'KOFFI',
        premiere: '2026-03-02T19:00:00Z',
        prenom: 'ABOU',
        statut: 'QUALIFIE',
        telephone: '07 •• •• 44 01',
      },
      {
        derniere: '2026-09-21T12:40:00Z',
        id: 'd2',
        nbCaptures: 3,
        nom: 'KOFFI',
        premiere: '2026-08-11T18:20:00Z',
        prenom: null,
        statut: 'A_QUALIFIER',
        telephone: '05 •• •• 03 04',
      },
      {
        derniere: '2026-06-02T11:00:00Z',
        id: 'd3',
        nbCaptures: 1,
        nom: 'KOFFI',
        premiere: '2026-06-02T11:00:00Z',
        prenom: null,
        statut: 'INJOIGNABLE',
        telephone: '27 •• •• 10 10',
      },
    ],
    nb: 3,
    nom: 'KOFFI',
  },
  {
    fiches: [
      {
        derniere: '2026-09-25T19:05:00Z',
        id: 'd4',
        nbCaptures: 7,
        nom: 'N’DRI',
        premiere: '2026-05-04T19:30:00Z',
        prenom: 'YAO',
        statut: 'QUALIFIE',
        telephone: '05 •• •• 22 11',
      },
      {
        derniere: '2026-09-18T20:15:00Z',
        id: 'd5',
        nbCaptures: 6,
        nom: 'N’DRI',
        premiere: '2026-04-30T19:00:00Z',
        prenom: null,
        statut: 'A_QUALIFIER',
        telephone: '01 •• •• 88 77',
      },
    ],
    nb: 2,
    nom: 'N’DRI',
  },
];

const JOURNAL: ILigneJournalFusion[] = [
  {
    annuleAt: null,
    annuleMotif: null,
    annulePar: null,
    annulee: false,
    appelsDeplaces: 2,
    capturesDeplacees: 4,
    cibleId: 'f2',
    cibleNom: 'AGHA SORO',
    cibleTelephone: '05 •• •• 22 11',
    fusionneAt: '2026-09-28T16:42:00Z',
    fusionnePar: null,
    id: 'j1',
    sourceId: 'f1',
    sourceNom: 'AGHA',
    sourceTelephone: '07 •• •• 55 55',
  },
  {
    annuleAt: '2026-09-27T09:12:00Z',
    annuleMotif: 'deux personnes différentes, même nom de famille',
    annulePar: null,
    annulee: true,
    appelsDeplaces: 0,
    capturesDeplacees: 1,
    cibleId: 'f4',
    cibleNom: 'BAMBA',
    cibleTelephone: '27 •• •• 10 10',
    fusionneAt: '2026-09-27T08:55:00Z',
    fusionnePar: null,
    id: 'j2',
    sourceId: 'f3',
    sourceNom: 'BAMBA',
    sourceTelephone: '07 •• •• 88 77',
  },
];

function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
  const [sombre, setSombre] = React.useState(false);
  React.useEffect(() => {
    const html = document.documentElement;
    const avant = html.className;
    html.className = sombre ? 'dark' : 'light';
    return () => {
      html.className = avant;
    };
  }, [sombre]);
  return [sombre, setSombre];
}

export default function ApercuDoublons() {
  const [sombre, setSombre] = useThemeSombre();
  const [vide, setVide] = React.useState(false);
  const [etroit, setEtroit] = React.useState(true);

  const client = React.useMemo(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Infinity,
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });
    c.setQueryData(bddClientsKeys.doublons(), vide ? [] : GROUPES);
    c.setQueryData(bddClientsKeys.journalFusions(), vide ? [] : JOURNAL);
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Doublons et fusions</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec doublons' : 'Base propre'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli. Les fusions ne partent nulle part sur ce banc : la fenêtre de
        confirmation s&apos;ouvre, l&apos;appel échoue faute de réseau.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <QueryClientProvider client={client}>
          <DoublonsView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
