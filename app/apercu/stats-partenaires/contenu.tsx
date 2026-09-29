'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { StatsPartenairesView } from '@/components/bdd-clients/stats/stats-partenaires-view';
import { bddClientsKeys, type IStatPartenaire } from '@/features/bdd-clients';

/**
 * Le banc des STATISTIQUES PAR RESTAURANT.
 *
 * <p>Ce qu'on vient regarder : que la part d'exclusifs se compare d'une ligne à l'autre
 * sans lire les nombres, et que les colonnes de chiffres s'alignent verticalement.</p>
 */

const LIGNES: IStatPartenaire[] = [
  { montant: 8_240_000, nbClients: 412, nbCommandes: 1_180, nbExclusifs: 331, nbPartages: 81, panierMoyen: 6_983, partExclusifs: 0.803, partenaire: 'EM SHERIF DELI', partenaireId: 'p1' },
  { montant: 5_120_000, nbClients: 388, nbCommandes: 902, nbExclusifs: 140, nbPartages: 248, panierMoyen: 5_676, partExclusifs: 0.361, partenaire: 'TSUNAMI', partenaireId: 'p2' },
  { montant: 2_960_000, nbClients: 221, nbCommandes: 604, nbExclusifs: 188, nbPartages: 33, panierMoyen: 4_900, partExclusifs: 0.851, partenaire: 'DEBONAIRS', partenaireId: 'p3' },
  { montant: 0, nbClients: 96, nbCommandes: 141, nbExclusifs: 12, nbPartages: 84, panierMoyen: null, partExclusifs: 0.125, partenaire: 'CHICKEN NATION COCODY', partenaireId: 'p4' },
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

export default function ApercuStatsPartenaires() {
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
    c.setQueryData(bddClientsKeys.statsPartenaires('', ''), vide ? [] : LIGNES);
    c.setQueryData(bddClientsKeys.voisinsPartenaire('p1', '', ''), [
      { nbClients: 64, partenaire: 'TSUNAMI', partenaireId: 'p2' },
      { nbClients: 12, partenaire: 'DEBONAIRS', partenaireId: 'p3' },
    ]);
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Statistiques par restaurant</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec données' : 'Aucune commande'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli sur « toute la base ». Poser une période changera la clé et rendra
        un tableau vide : c&apos;est attendu sur un banc sans réseau. Le détail n&apos;est
        semé que pour EM SHERIF DELI.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <NuqsAdapter>
          {/* ⚠ La `key` remonte l'arbre : sans elle, l'échange de client ne
            réabonne rien et le bouton est inerte. Voir le banc
            `base-clients`, qui porte le raisonnement. */}
          <QueryClientProvider client={client} key={vide ? 'vide' : 'plein'}>
            <StatsPartenairesView />
          </QueryClientProvider>
        </NuqsAdapter>
      </div>
    </main>
  );
}
