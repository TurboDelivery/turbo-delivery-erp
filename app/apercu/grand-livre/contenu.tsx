'use client';

import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { GrandLivreTab } from '@/components/finance/hub/grand-livre-tab';
import { depenseKeyQuery } from '@/features/depenses/queries/index.query';

/**
 * LE BANC DU GRAND LIVRE.
 *
 * <p>Ce qu'on vient regarder : que les six colonnes se lisent d'un coup d'oeil, que les
 * montants soient en chasse tabulaire et alignés à droite, que les trois mesures portent
 * la même sélection que la liste, et que l'état vide DISE d'où vient une dépense plutôt
 * que de se contenter de « aucun résultat ».</p>
 *
 * <p>⚠ Les refetchOn* sont coupés, sans quoi la donnée semée repartirait au réseau et le
 * banc afficherait un échec de lecture. La key sur le fournisseur remonte l'arbre :
 * échanger le client ne réabonne rien sans elle.</p>
 */

const DEBUT = new Date('2026-08-01T00:00:00Z');
const FIN = new Date('2026-08-31T00:00:00Z');

const ligne = (i: number, nom: string, cat: string, montant: number, statut: string, type: string) => ({
  categorie: { description: '', id: `c${i}`, nomCategorie: cat },
  createdAt: '2026-08-12T10:00:00Z',
  dateDepense: `2026-08-${String((i % 27) + 1).padStart(2, '0')}T00:00:00Z`,
  description: '',
  id: `d${i}`,
  libelle: nom,
  montant,
  statut,
  typeDepense: type,
  updatedAt: '2026-08-12T10:00:00Z',
});

const LIGNES = [
  ligne(1, 'Péage Abidjan-Yamoussoukro', 'PEAGES', 12_500, 'PAID', 'VARIABLE'),
  ligne(2, 'Achat de bidon d’huile', 'ACHAT DE PIECES MECANIQUES', 26_000, 'PAID', 'VARIABLE'),
  ligne(3, 'Dotation téléphonique', 'DOTATION-TELEPHONIQUE', 30_000, 'A_DECAISSER', 'VARIABLE'),
  ligne(4, 'Paiement des salaires du mois AUGUST', 'SALAIRE DU PERSONNEL', 5_990_000, 'PENDING', 'FIXE'),
  ligne(5, 'Contravention policière', 'CONTRAVENTION POLICIERE', 7_000, 'DECAISSE', 'VARIABLE'),
];

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

export default function ApercuGrandLivre() {
  const [sombre, setSombre] = useTheme();
  const [vide, setVide] = React.useState(false);

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
    const params = { categoriesDepense: undefined, debut: DEBUT, fin: FIN, limit: 15, page: 0, statut: undefined };
    c.setQueryData(depenseKeyQuery('list', params), {
      content: vide ? [] : LIGNES,
      totalElements: vide ? 0 : LIGNES.length,
      totalPages: vide ? 0 : 1,
    });
    c.setQueryData(depenseKeyQuery('stats', { categoriesDepense: undefined, debut: DEBUT, fin: FIN, statut: undefined }), {
      montant_max: vide ? 0 : 5_990_000,
      montant_min: vide ? 0 : 7_000,
      montant_paye: vide ? 0 : 45_500,
      montant_restant: vide ? 0 : 6_020_000,
      montant_total: vide ? 0 : 6_065_500,
      nombre_categories: vide ? 0 : 5,
      nombre_depenses: vide ? 0 : LIGNES.length,
      nombre_payees: vide ? 0 : 2,
      nombre_restantes: vide ? 0 : 3,
    });
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Grand livre des dépenses</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec lignes' : 'Sélection vide'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli sur août 2026. Changer le statut ou exporter part au réseau et échoue :
        seule la sélection semée est servie.
      </p>

      <QueryClientProvider client={client} key={vide ? 'vide' : 'plein'}>
        <GrandLivreTab categories={[]} debut={DEBUT} fin={FIN} />
      </QueryClientProvider>
    </main>
  );
}
