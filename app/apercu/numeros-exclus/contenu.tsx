'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ListeNoireView } from '@/components/bdd-clients/liste-noire/liste-noire-view';
import { bddClientsKeys, type ILigneListeNoire } from '@/features/bdd-clients';

/**
 * Le banc des NUMÉROS EXCLUS.
 *
 * <p>Ce qu'on vient regarder : que le formulaire dise ce qu'il va faire avant le clic,
 * et que chaque ligne dise ce que son exclusion a coûté en commandes retirées.</p>
 */

const LIGNES: ILigneListeNoire[] = [
  {
    capturesRetirees: 412,
    createdAt: '2026-09-12T10:22:00Z',
    creePar: null,
    ficheRetireeId: 'f1',
    libelle: 'Standard Em Sherif Deli',
    motif: 'imprimé sur tous les tickets de la caisse',
    telephone: '+2250709444401',
    telephoneMasque: '07 •• •• 44 01',
  },
  {
    capturesRetirees: 0,
    createdAt: '2026-09-20T16:05:00Z',
    creePar: null,
    ficheRetireeId: null,
    libelle: 'Numéro de test recette',
    motif: null,
    telephone: '+2250100000000',
    telephoneMasque: '01 •• •• 00 00',
  },
  {
    capturesRetirees: 1,
    createdAt: '2026-09-25T08:40:00Z',
    creePar: null,
    ficheRetireeId: 'f3',
    libelle: 'Livreur Turbo',
    motif: 'commande pour le compte du client',
    telephone: '+2250509444402',
    telephoneMasque: '05 •• •• 44 02',
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

export default function ApercuNumerosExclus() {
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
    c.setQueryData(bddClientsKeys.listeNoire(), vide ? [] : LIGNES);
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Numéros exclus</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec numéros' : 'Liste vide'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli. Exclure ou retirer ne part nulle part sur ce banc.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        {/* ⚠ La `key` remonte l'arbre : sans elle, l'échange de client ne
            réabonne rien et le bouton est inerte. Voir le banc
            `base-clients`, qui porte le raisonnement. */}
          <QueryClientProvider client={client} key={vide ? 'vide' : 'plein'}>
          <ListeNoireView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
