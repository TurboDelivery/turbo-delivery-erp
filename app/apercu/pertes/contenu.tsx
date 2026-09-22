'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Button } from '@heroui-v3/react';

import { EncoursPertesManager } from '@/components/finance/encours/encours-pertes-manager';
import { encoursKeys, type IEncoursReleve } from '@/features/encours';

/**
 * Le banc des PERTES ET VOLS.
 *
 * <p>Il existe pour une raison précise : ce registre porte désormais trois actions par
 * ligne, dont deux remettent le montant dans les encours et une seule laisse la ligne à
 * l'écran. Un opérateur qui confond les deux efface une décision. C'est un écran qui se
 * REGARDE avant de partir, et l'écran réel exige une session et un backend.</p>
 *
 * <p>La session est simulée avec le rôle DG : sans elle, `usePeutDeciderEncours` rend
 * faux et l'onglet entier n'apparaît pas.</p>
 */

const ANNEE = new Date().getFullYear();

const CATEGORIES = [
  { code: 'ERREUR_FACTURATION', exigePrecision: false, libelle: 'Erreur de facturation', ordre: 1 },
  {
    code: 'NON_REVERSEMENT_LIVREUR',
    exigePrecision: false,
    libelle: 'Non-reversement livreur',
    ordre: 2,
  },
  { code: 'LITIGE_PARTENAIRE', exigePrecision: false, libelle: 'Litige partenaire', ordre: 3 },
  { code: 'AUTRE', exigePrecision: true, libelle: 'Autre', ordre: 4 },
];

const PERTES = [
  {
    annule: false,
    categorieCode: 'NON_REVERSEMENT_LIVREUR',
    commentaire: 'Tickets de la semaine 34 jamais reversés par deux coursiers.',
    createdAt: `${ANNEE}-09-02T10:12:00Z`,
    factureId: 'f-1',
    id: 'p-1',
    montant: 250000,
    restaurantId: 'r-1',
  },
  {
    annule: false,
    categorieCode: 'ERREUR_FACTURATION',
    commentaire: null,
    createdAt: `${ANNEE}-08-19T08:30:00Z`,
    factureId: 'f-2',
    id: 'p-2',
    montant: 42500,
    restaurantId: 'r-2',
  },
  {
    annule: false,
    categorieCode: 'AUTRE',
    commentaire: 'Arbitrage Direction du 12/07.',
    createdAt: `${ANNEE}-07-12T16:45:00Z`,
    factureId: 'f-3',
    id: 'p-3',
    montant: 1180000,
    precisionLibre: 'Geste commercial après la panne du dispatch',
    restaurantId: 'r-3',
  },
];

const STATS = {
  nbLignes: 3,
  parCategorie: [
    { cle: 'AUTRE', libelle: 'Autre', montant: 1180000, nb: 1 },
    { cle: 'NON_REVERSEMENT_LIVREUR', libelle: 'Non-reversement livreur', montant: 250000, nb: 1 },
    { cle: 'ERREUR_FACTURATION', libelle: 'Erreur de facturation', montant: 42500, nb: 1 },
  ],
  parMois: [
    { cle: `${ANNEE}-07`, libelle: `Juillet ${ANNEE}`, montant: 1180000, nb: 1 },
    { cle: `${ANNEE}-08`, libelle: `Août ${ANNEE}`, montant: 42500, nb: 1 },
    { cle: `${ANNEE}-09`, libelle: `Septembre ${ANNEE}`, montant: 250000, nb: 1 },
  ],
  parPartenaire: [
    { cle: 'r-3', libelle: 'CHICKEN NATION · Plateau', montant: 1180000, nb: 1 },
    { cle: 'r-1', libelle: 'PIZZA ROMA · Cocody', montant: 250000, nb: 1 },
    { cle: 'r-2', libelle: 'LE BISTROT · Marcory', montant: 42500, nb: 1 },
  ],
  total: 1472500,
};

/** Un relevé réduit : il ne sert qu'à alimenter la liste des factures choisissables. */
const RELEVE = {
  deductions: [],
  moisColonnes: [],
  nbFactures: 3,
  partenaires: [
    {
      groupe: 'PIZZA ROMA',
      stores: [
        {
          factures: [
            { id: 'f-1', libelle: 'Quinzaine 2', periode: 'Septembre', solde: 310000 },
            { id: 'f-2', libelle: 'Quinzaine 1', periode: 'Août', solde: 90000 },
          ],
          store: 'Cocody',
        },
      ],
    },
  ],
} as unknown as IEncoursReleve;

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark`, et sur un div imbriqué c'est
 * le triplet qui gagne — `bg-danger` ne peint alors plus rien.</p>
 */
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

function clientPreRempli(avecLignes: boolean): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const debut = `${ANNEE - 1}-01-01`;
  const fin = `${ANNEE}-12-31`;
  client.setQueryData(encoursKeys.categoriesPerte(), CATEGORIES);
  client.setQueryData(encoursKeys.pertes(), avecLignes ? PERTES : []);
  client.setQueryData(
    encoursKeys.statsPertes(debut, fin),
    avecLignes ? STATS : { nbLignes: 0, parCategorie: [], parMois: [], parPartenaire: [], total: 0 },
  );
  return client;
}

export default function ApercuPertes() {
  const [sombre, setSombre] = useThemeSombre();
  const [vide, setVide] = React.useState(false);
  const [etroit, setEtroit] = React.useState(true);

  // Un client neuf à chaque rendu reperdrait le cache pré-rempli.
  const avecLignes = React.useMemo(() => clientPreRempli(true), []);
  const sansLigne = React.useMemo(() => clientPreRempli(false), []);
  const client = vide ? sansLigne : avecLignes;

  return (
    <SessionProvider
      session={
        {
          expires: `${ANNEE + 1}-01-01T00:00:00Z`,
          user: { nomComplet: 'KOUASSI Adjoua', role: 'DG' },
        } as unknown as Parameters<typeof SessionProvider>[0]['session']
      }
    >
      <main className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
            <h1 className="text-xl font-semibold text-foreground">Pertes &amp; vols</h1>
          </div>
          <div className="ms-auto flex flex-wrap gap-2">
            <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
              {sombre ? 'Clair' : 'Sombre'}
            </Button>
            <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
              {vide ? 'Avec lignes' : 'Registre vide'}
            </Button>
            <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
              {etroit ? '1000 px' : 'Pleine largeur'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted">
          Cache pré-rempli, aucun appel réseau. Les boutons écrivent vers le serveur : sur ce
          banc ils échouent, ce qui est attendu. Ce qu&apos;on vient regarder, c&apos;est la
          rangée d&apos;actions et les deux fenêtres.
        </p>

        <div
          className="rounded-xl border border-separator p-4"
          style={etroit ? { maxWidth: 1000 } : undefined}
        >
          <QueryClientProvider client={client}>
            <EncoursPertesManager releve={RELEVE} />
          </QueryClientProvider>
        </div>
      </main>
    </SessionProvider>
  );
}
