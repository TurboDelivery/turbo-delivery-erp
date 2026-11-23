'use client';

import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import React from 'react';

import { HistoriqueFusions } from '@/components/finance/configuration/historique-fusions';
import { CategorieDepenseList } from '@/features/depenses/components/depense-list/categorie-depense';
import type { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import type { IFusionCategorie } from '@/features/depenses/apis/fusion-categorie.api';

/**
 * LE BANC DE L'HISTORIQUE DES FUSIONS.
 *
 * <h3>Ce qu'on vient regarder</h3>
 * <p>Qu'on lise d'un coup d'oeil ce qui a été fusionné, combien de lignes ont bougé, et
 * dans quoi. Que l'annulation ne soit proposée que là où elle est possible, donc pas sur
 * une fusion déjà défaite. Et que l'état vide DISE que les fusions antérieures au journal
 * n'y figurent pas, au lieu de laisser croire qu'il n'y a jamais eu de fusion.</p>
 *
 * <p>⚠ Les `refetchOn*` sont coupés : sans eux la donnée semée repartirait au réseau, et
 * le banc afficherait un échec de lecture au lieu de l'écran.</p>
 *
 * <p>⚠ La `key` sur le fournisseur remonte l'arbre. Sans elle, échanger le client ne
 * réabonne rien et les boutons du banc restent inertes. C'est la leçon du banc
 * `base-clients`.</p>
 *
 * <p>⚠ Le thème bascule sur `<html>`, jamais sur une enveloppe : les jetons shadcn sont
 * déclarés en triplets HSL bruts dans la portée `.dark`, et sur un div imbriqué c'est le
 * triplet qui gagne.</p>
 */

const JOURNAL: IFusionCategorie[] = [
  {
    annuleeAt: null,
    annuleePar: null,
    auteurId: '1db26a14-1df0-4418-b576-929e7b51b692',
    auteurNom: 'KONE Awa',
    auteurRole: 'Comptable',
    categorieCibleId: 'c-1',
    categorieSourceDescription: 'Réparations et entretien des deux-roues',
    categorieSourceId: 's-1',
    categorieSourceNom: 'REPARATIONS MOTOS',
    chargesFixesIds: ['cf-1', 'cf-2'],
    chargesVariablesIds: ['cv-1'],
    createdAt: '2026-11-20T23:44:00Z',
    depensesIds: Array.from({ length: 37 }, (_, i) => `d-${i}`),
    id: 'f-1',
  },
  {
    annuleeAt: null,
    annuleePar: null,
    auteurId: '1992a5ff-94b4-4049-9356-a72c7f81f8f1',
    auteurNom: null,
    auteurRole: null,
    categorieCibleId: 'c-1',
    categorieSourceDescription: null,
    categorieSourceId: 's-2',
    categorieSourceNom: 'solde de tout compte',
    chargesFixesIds: [],
    chargesVariablesIds: [],
    createdAt: '2026-11-20T21:12:00Z',
    depensesIds: ['d-100'],
    id: 'f-2',
  },
  {
    annuleeAt: '2026-11-20T22:05:00Z',
    annuleePar: '1db26a14-1df0-4418-b576-929e7b51b692',
    auteurId: '1db26a14-1df0-4418-b576-929e7b51b692',
    auteurNom: 'KONE Awa',
    auteurRole: 'Comptable',
    categorieCibleId: 'c-2',
    categorieSourceDescription: 'Carburant des motos',
    categorieSourceId: 's-3',
    categorieSourceNom: 'CARBURANT',
    chargesFixesIds: ['cf-9'],
    chargesVariablesIds: ['cv-7', 'cv-8'],
    createdAt: '2026-11-20T20:40:00Z',
    depensesIds: Array.from({ length: 212 }, (_, i) => `dd-${i}`),
    id: 'f-3',
  },
];

/** Le référentiel de la maquette (planche 2), avec ses doublons à fusionner. */
const CATEGORIES: ICategorieDepense[] = [
  ['c-1', 'REPARATIONS MOTOS', 'Entretien et réparation des motos de la flotte', 742500, '2026-03-05'],
  ['c-2', 'REPARATION MOTO', '', 156000, '2026-05-12'],
  ['c-3', 'ENTRETIEN MOTO', '', 87000, '2026-07-02'],
  ['c-4', 'LOYERS', '', 5000000, '2026-02-01'],
  ['c-5', 'LOYER', '', 1000000, '2026-04-14'],
  ['c-6', 'DOTATION CARBURANT HEBDO SUPERVISEURS', 'Chaque semaine, nous déboursons une somme pour le carburant de nos superviseurs.', 5124000, '2026-02-01'],
  ['c-7', 'VIGNETTE', 'VIGNETTE DE MOTO', 0, '2026-05-20'],
].map(([id, nomCategorie, description, totalDepense, jour]) => ({
  createdAt: `${jour}T09:00:00Z`,
  description: description as string,
  id: id as string,
  nomCategorie: nomCategorie as string,
  totalDepense: totalDepense as number,
  updatedAt: `${jour}T09:00:00Z`,
}));
const NB = [41, 9, 6, 10, 2, 42, 0];

function useTheme(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
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

export default function ApercuHistoriqueFusions() {
  const [sombre, setSombre] = useTheme();
  const [vide, setVide] = React.useState(false);
  const [etroit, setEtroit] = React.useState(false);

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
    c.setQueryData(['depenses', 'fusions', 'historique'], vide ? [] : JOURNAL);
    // La liste des catégories et leurs volumes : ce que <CategorieDepenseList /> lit.
    c.setQueryData(['categorieDepense', 'list'], vide ? [] : CATEGORIES);
    // La comparaison que la fenêtre de fusion lit quand on coche les deux premières lignes.
    c.setQueryData(
      ['categorie-donnees-rattachees', 'c-1', 'c-2'],
      [
        { chargesFixes: 0, chargesVariables: 41, depenses: 37, description: CATEGORIES[0].description ?? null, id: 'c-1', modelesRecurrents: 0, nomCategorie: 'REPARATIONS MOTOS', total: 78 },
        { chargesFixes: 0, chargesVariables: 9, depenses: 8, description: null, id: 'c-2', modelesRecurrents: 1, nomCategorie: 'REPARATION MOTO', total: 17 },
      ],
    );
    // L'historique de la première catégorie, tel que l'audit central le rend.
    c.setQueryData(
      ['depenses', 'categories', 'historique', 'c-1'],
      [
        { occurredAt: '2026-03-05T09:00:00Z', typeAction: 'CREATION', utilisateur: 'Koné', valeursApres: { nomCategorie: 'REPARATION DES MOTOS' }, valeursAvant: null },
        { occurredAt: '2026-06-12T14:20:00Z', typeAction: 'MODIFICATION', utilisateur: 'Koné', valeursApres: { nomCategorie: 'REPARATIONS MOTOS' }, valeursAvant: { nomCategorie: 'REPARATION DES MOTOS' } },
      ],
    );
    c.setQueryData(
      ['depenses', 'categories', 'donnees-rattachees', CATEGORIES.map((x) => x.id).sort().join(',')],
      CATEGORIES.map((x, i) => ({
        chargesFixes: i >= 3 && i <= 5 ? NB[i] : 0,
        chargesVariables: i >= 3 && i <= 5 ? 0 : NB[i],
        depenses: NB[i],
        description: x.description ?? null,
        id: x.id,
        nomCategorie: x.nomCategorie,
        total: x.totalDepense,
      })),
    );
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Historique des fusions</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec fusions' : 'Journal vide'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli. Aucune annulation ne part sur ce banc : la fenêtre s&apos;ouvre, et
        l&apos;appel échoue faute de réseau. La troisième ligne est DÉJÀ annulée, elle ne doit
        donc pas porter de bouton.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <SessionProvider
          session={{
            expires: '2030-01-01T00:00:00Z',
            user: {
              email: 'dga@exemple.test',
              id: '1db26a14-1df0-4418-b576-929e7b51b692',
              image: '',
              name: 'ASSAH DOSSOU CEDRIC',
              nomComplet: 'ASSAH DOSSOU CEDRIC',
              role: 'DGA',
              token: 'banc',
            },
          }}
        >
          <QueryClientProvider client={client} key={vide ? 'vide' : 'plein'}>
            {/* LA LISTE ENTIÈRE (planche 2) : onglets Actives / Fusionnées, recherche,
                nombre de dépenses, Renommer, Historique. C'est elle que l'écran de
                configuration monte ; le journal seul, dessous, reste pour comparaison. */}
            <CategorieDepenseList />
            <div className="h-6" />
            <HistoriqueFusions />
          </QueryClientProvider>
        </SessionProvider>
      </div>
    </main>
  );
}
