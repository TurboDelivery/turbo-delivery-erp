'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClientsView } from '@/components/bdd-clients/liste/clients-view';
import { bddClientsKeys, type IFiltresClients, type ILigneClient } from '@/features/bdd-clients';

/**
 * Le banc de la BASE CLIENTS.
 *
 * <p>Il monte la vraie vue — cartes, filtres, tableau — sur un cache pré-rempli. Ce qu'on
 * vient regarder : la densité sur la fenêtre réelle des postes, le fait qu'une seule
 * couleur parle (le badge des fidèles), et l'alignement des trois colonnes de chiffres
 * qu'on parcourt verticalement.</p>
 *
 * <p>⚠ Les `refetchOn*` sont coupés, pas le `staleTime` : le hook impose le sien, et
 * au-delà la donnée semée serait jugée périmée et la requête repartirait vers le réseau.
 * Leçon déjà payée sur le banc des programmes le 28/09.</p>
 */

/** Les valeurs par défaut de `useQueryStates` : la clé du cache doit tomber juste. */
const FILTRES_PAR_DEFAUT: IFiltresClients = {
  capturesMin: null,
  consentement: '',
  debut: '',
  fin: '',
  logique: 'AU_MOINS_UN',
  page: 0,
  partenaires: [],
  partenairesMin: null,
  recherche: '',
  segment: '',
  statut: '',
  zones: [],
};

function ligne(
  position: number,
  nom: string | null,
  tel: string,
  captures: number,
  restaurants: number,
  statut: string,
  segment: string | null,
  consentement: string | null,
  montant: number,
  alias: string[] = [],
): ILigneClient {
  return {
    alias,
    consentement,
    derniereCaptureAt: `2026-09-${String(28 - position).padStart(2, '0')}T10:00:00Z`,
    id: `c${position}`,
    montantCumule: montant,
    nbCaptures: captures,
    nbPartenaires: restaurants,
    nom,
    partenairePrincipalId: null,
    position,
    premiereCaptureAt: '2026-06-01T10:00:00Z',
    prenom: null,
    segment,
    statut,
    telephone: tel,
    zonePrincipaleId: null,
  };
}

const LIGNES: ILigneClient[] = [
  ligne(1, 'KOFFI', '07 •• •• 44 01', 12, 3, 'QUALIFIE', 'VIP', 'OUI', 1_284_000, ['MR KOFFI ABOU']),
  ligne(2, "N'DRI", '05 •• •• 03 04', 4, 2, 'QUALIFIE', 'REGULIER', 'NON', 96_500),
  ligne(3, 'SANNA', '01 •• •• 09 09', 2, 1, 'A_QUALIFIER', 'OCCASIONNEL', null, 34_000),
  ligne(4, null, '07 •• •• 88 77', 1, 1, 'A_QUALIFIER', 'NOUVEAU', null, 0),
  ligne(5, 'AGHA', '05 •• •• 22 11', 7, 2, 'QUALIFIE', 'REGULIER', 'PAS_DEMANDE', 410_000),
  ligne(6, 'BAMBA', '27 •• •• 10 10', 1, 1, 'INJOIGNABLE', 'DORMANT', null, 12_000),
  ligne(7, 'CISSE', '07 •• •• 55 55', 3, 1, 'REJETE', 'OCCASIONNEL', null, 45_000),
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

export default function ApercuBaseClients() {
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
    const lignes = vide ? [] : LIGNES;
    c.setQueryData(bddClientsKeys.liste(FILTRES_PAR_DEFAUT), {
      content: lignes,
      number: 0,
      size: 25,
      totalElements: vide ? 0 : 1_284,
      totalPages: vide ? 0 : 52,
    });
    c.setQueryData(bddClientsKeys.kpis(FILTRES_PAR_DEFAUT), {
      clientsMultiRestaurants: vide ? 0 : 214,
      clientsUniques: vide ? 0 : 1_284,
      nouveauxClients: vide ? 0 : 1_284,
      tauxConsentement: vide ? 0 : 0.41,
      tauxQualification: vide ? 0 : 0.62,
    });
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Base de données clients</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec clients' : 'Base vide'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli sur les filtres par défaut. Poser un filtre changera la clé et
        rendra une liste vide : c&apos;est attendu sur un banc sans réseau.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <QueryClientProvider client={client}>
          <ClientsView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
