'use client';

import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { BarreFiltresFinance } from '@/components/finance/hub/barre-filtres-finance';
import { categorieDepenseKeyQuery } from '@/features/depenses/queries/category/index.query';
import { fmtFcfa } from '@/features/finances-hub';

/**
 * LE BANC DE LA BARRE DE FILTRES.
 *
 * <p>Ce qu'on vient regarder, et qui ne se prouve qu'à l'œil : que la rangée se lise
 * comme une barre de filtres et non comme un titre de section — c'était tout le défaut —,
 * que les trois champs et le bouton soient alignés par le BAS malgré les libellés posés
 * au-dessus des champs, que la ligne de résultat dise « sur N » et pas seulement « N »,
 * et que l'ensemble tienne en clair comme en sombre, et à la largeur d'un téléphone.</p>
 *
 * <p>⚠ Le thème bascule sur `<html>`, jamais sur une enveloppe : `styles/tailwind.css`
 * déclare encore des jetons shadcn en triplets HSL bruts dans la portée `.dark`, et sur
 * un div imbriqué c'est le triplet qui gagne.</p>
 *
 * <p>⚠ Les catégories sont semées dans le cache, mais leur option de requête porte
 * `refetchOnMount: true` : le montage repart quand même au réseau et échoue. La liste
 * reste celle qu'on a semée, et une alerte d'échec de lecture peut passer. C'est le
 * comportement attendu sur un banc, pas un défaut de la barre.</p>
 */

const CATEGORIES = [
  { description: '', id: 'c1', nomCategorie: 'LOYERS' },
  { description: '', id: 'c2', nomCategorie: 'CIE | SODECI' },
  { description: '', id: 'c3', nomCategorie: 'IMPOTS ET AUTRES COTISATIONS' },
  { description: '', id: 'c4', nomCategorie: 'DOTATION-TELEPHONIQUE' },
  { description: '', id: 'c5', nomCategorie: 'SECURITE-SOCIALE' },
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

export default function ApercuFiltresFinance() {
  const [sombre, setSombre] = useTheme();
  const [recherche, setRecherche] = React.useState('');
  const [etape, setEtape] = React.useState('tous');
  const [categories, setCategories] = React.useState<string[]>([]);
  const [surLeTableau, setSurLeTableau] = React.useState(true);

  const client = React.useMemo(() => {
    const c = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    c.setQueryData(categorieDepenseKeyQuery('list'), CATEGORIES);
    return c;
  }, []);

  const aDesFiltres = recherche.trim() !== '' || etape !== 'tous' || categories.length > 0;
  // Résultat simulé : la barre ne calcule rien, elle affiche ce que le tableau lui donne.
  const retenues = aDesFiltres ? 37 : 74;

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Barre de filtres finance</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setSurLeTableau((p) => !p)} size="sm" variant="ghost">
            {surLeTableau ? 'Onglet Grand livre' : 'Onglet Charges'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        {surLeTableau
          ? 'Onglet de charges : recherche, catégories et étape.'
          : 'Onglet Grand livre : seule la catégorie reste, elle part au serveur. La recherche en mémoire ne verrait que la page courante.'}
      </p>

      <QueryClientProvider client={client}>
        <BarreFiltresFinance
          aDesFiltres={aDesFiltres}
          categories={categories}
          etape={etape}
          montantRetenu={fmtFcfa(retenues * 66_000)}
          onCategories={(c) => setCategories(c ?? [])}
          onEtape={setEtape}
          onRecherche={setRecherche}
          onReinitialiser={() => {
            setRecherche('');
            setEtape('tous');
            setCategories([]);
          }}
          recherche={recherche}
          retenues={retenues}
          surLeTableau={surLeTableau}
          total={74}
        />
      </QueryClientProvider>

      <pre className="rounded-lg bg-surface-secondary p-3 text-xs text-muted">
        {JSON.stringify({ categories, etape, recherche }, null, 2)}
      </pre>
    </main>
  );
}
