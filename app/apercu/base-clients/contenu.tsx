'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClientsView } from '@/components/bdd-clients/liste/clients-view';
import {
  bddClientsKeys,
  type IFicheClient,
  type IFiltresClients,
  type ILigneClient,
} from '@/features/bdd-clients';

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
  capturesMax: null,
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

/** La fiche de KOFFI, pour le panneau lateral. */
const FICHE: IFicheClient = {
  alias: ['MR KOFFI ABOU'],
  appels: [
    { action: 'QUALIFIER', avisEfficacite: 'OUI', commentaire: 'Livraison rapide, rien a signaler.', consentement: 'OUI', date: '2026-09-20T09:12:00Z', id: 'a3', joignabilite: 'JOIGNABLE', note: 5, partenaireAvisId: 'EM SHERIF DELI', pointsSignales: [], qualifiePar: null, tentative: 3 },
    { action: 'REPORTER', avisEfficacite: null, commentaire: null, consentement: null, date: '2026-09-18T15:40:00Z', id: 'a2', joignabilite: 'INJOIGNABLE', note: null, partenaireAvisId: null, pointsSignales: [], qualifiePar: null, tentative: 2 },
    { action: 'REPORTER', avisEfficacite: null, commentaire: 'Messagerie.', consentement: null, date: '2026-09-17T11:05:00Z', id: 'a1', joignabilite: 'INJOIGNABLE', note: null, partenaireAvisId: null, pointsSignales: [], qualifiePar: null, tentative: 1 },
  ],
  captures: [
    { dateCommande: '2026-09-27T20:10:00Z', id: 'x1', montant: 21500, numCheck: '111025', numCommande: '20049', partenaire: 'EM SHERIF DELI', partenaireId: 'p-esd', rangCapture: 12, saisiLe: '2026-09-28T08:00:00Z', saisiPar: null, source: 'LOT', zoneSaisie: 'MARCORY RÉSIDENTIEL' },
    { dateCommande: '2026-09-14T19:30:00Z', id: 'x2', montant: 18000, numCheck: '110880', numCommande: null, partenaire: 'TSUNAMI', partenaireId: 'p-tsu', rangCapture: 11, saisiLe: '2026-09-15T08:00:00Z', saisiPar: null, source: 'LOT', zoneSaisie: 'MARCORY' },
    { dateCommande: null, id: 'x3', montant: null, numCheck: null, numCommande: null, partenaire: 'DEBONAIRS', partenaireId: 'p-deb', rangCapture: 10, saisiLe: '2026-09-02T08:00:00Z', saisiPar: null, source: 'DEMANDE_TURBOYS', zoneSaisie: null },
  ],
  canalPrefere: 'WHATSAPP',
  consentement: 'OUI',
  consentementDate: '2026-09-20T09:12:00Z',
  consentementSource: 'APPEL',
  derniereCaptureAt: '2026-09-27T20:10:00Z',
  id: 'c1',
  international: false,
  montantCumule: 1_284_000,
  nbCaptures: 12,
  nbPartenaires: 3,
  nom: 'KOFFI',
  note: 'Demande toujours la sauce a part.',
  panierMoyen: 116_727,
  parPartenaire: [
    { derniere: '2026-09-27T20:10:00Z', montant: 820_000, nbCaptures: 7, partenaire: 'EM SHERIF DELI', partenaireId: 'p-esd', premiere: '2026-03-02T19:00:00Z' },
    { derniere: '2026-09-14T19:30:00Z', montant: 396_000, nbCaptures: 4, partenaire: 'TSUNAMI', partenaireId: 'p-tsu', premiere: '2026-05-11T19:00:00Z' },
    { derniere: '2026-09-02T08:00:00Z', montant: 68_000, nbCaptures: 1, partenaire: 'DEBONAIRS', partenaireId: 'p-deb', premiere: '2026-09-02T08:00:00Z' },
  ],
  partenairePrincipalId: 'EM SHERIF DELI',
  position: 1,
  premiereCaptureAt: '2026-03-02T19:00:00Z',
  prenom: null,
  segment: 'VIP',
  segmentForce: false,
  statut: 'QUALIFIE',
  tags: ['fidele'],
  telephone: '07 •• •• 44 01',
  tentativesAppel: 3,
  zonePrincipaleId: null,
};

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
    c.setQueryData(bddClientsKeys.fiche('c1'), FICHE);
    // Une fiche À QUALIFIER : c'est la seule qui montre le formulaire d'appel.
    c.setQueryData(bddClientsKeys.fiche('c3'), {
      ...FICHE,
      consentement: null,
      id: 'c3',
      nom: 'SANNA',
      position: 3,
      segment: 'OCCASIONNEL',
      statut: 'A_QUALIFIER',
      telephone: '01 •• •• 09 09',
      tentativesAppel: 2,
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
        Cache pré-rempli sur les filtres par défaut. Poser un filtre change la clé : la
        requête part pour de vrai, échoue faute de session, et l&apos;écran montre son état
        d&apos;erreur. C&apos;est attendu ici, et c&apos;est aussi l&apos;occasion de le regarder.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        {/*
          ⚠ La `key` REMONTE l'arbre quand le jeu de données change, et ce n'est pas
          une optimisation : sans elle, le bouton ne fait rien.

          TanStack crée l'observateur d'une requête dans un `useState` initialisé une
          seule fois, avec le client capturé au PREMIER rendu. Échanger le client du
          fournisseur ne le réabonne donc pas : l'écran continue de lire l'ancien
          cache. Mesuré sur ce banc — le bouton affichait « Avec clients », donc l'état
          vide, et les mille deux cent quatre-vingt-quatre fiches restaient à l'écran.
          Un banc qui montre le contraire de ce qu'annonce son bouton est pire que pas
          de banc : il fait valider un état vide qu'on n'a jamais vu.
        */}
        <QueryClientProvider client={client} key={vide ? 'vide' : 'plein'}>
          <ClientsView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
