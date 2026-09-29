'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ImportView } from '@/components/bdd-clients/import/import-view';
import { bddClientsKeys } from '@/features/bdd-clients';
import { restaurantKeys } from '@/features/restaurants';

/**
 * Le banc de l'IMPORT DE CONTACTS.
 *
 * <p>Ce qu'on vient regarder : que l'atelier des colonnes se lise, que l'aperçu suive
 * chaque geste, et que le rattachement proposé tombe juste sur un fichier réaliste.</p>
 *
 * <p>Le bouton « Coller un exemple » écrit dans la zone de collage par un vrai événement
 * de presse-papier : c'est le chemin que l'opérateur emprunte, pas un raccourci qui
 * sauterait le code qu'on veut voir marcher.</p>
 */

const EXEMPLE = [
  'Téléphone client\tNom complet\tTotal TTC\tN° Ticket\tDate\tQuartier',
  "07 09 44 44 01\tKOFFI ABOU\t21 500 F\t111025\t2026-09-27\tMARCORY RÉSIDENTIEL",
  "05 01 02 03 04\tN'DRI YAO\t16 000 F\t111026\t2026-09-27\tCocody 2 plateaux",
  '27 20 10 10 10\tBAMBA SEYDOU\t9 000 F\t111027\t2026-09-26\tPlateau',
  '01 88 77 66 55\tAGHA MARIE CLAIRE\t34 250 F\t111028\t2026-09-26\tMARCORY RÉSIDENTIEL',
  '\tTOTAL\t80 750 F\t\t\t',
].join('\n');

/**
 * Un fichier qui DÉPASSE un lot, pour voir ce que l'écran en dit.
 *
 * <p>C'est l'état qui manquait : jusqu'ici le banc ne montrait qu'un fichier de quatre
 * lignes, et le chemin du découpage en lots successifs ne se regardait nulle part. Un
 * opérateur qui charge l'export d'un restaurant en a des milliers.</p>
 */
const GROS = [
  'Téléphone\tNom\tPrénoms\tMontant\tDate\tQuartier',
  ...Array.from({ length: 1200 }, (_, i) => {
    const n = String(70000000 + i).padStart(8, '0');
    return `07 ${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)}\tKOUASSI\tClient ${i + 1}\t${(5 + (i % 40)) * 500}\t2026-09-${String(1 + (i % 28)).padStart(2, '0')}\tCocody`;
  }),
].join('\n');

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

export default function ApercuImportContacts() {
  const [sombre, setSombre] = useThemeSombre();
  const [etroit, setEtroit] = React.useState(true);
  const [plafond, setPlafond] = React.useState(500);

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
    /*
     * La règle du serveur est SEMÉE, pas devinée.
     *
     * Sans elle, l'écran n'a pas de plafond et refuse de proposer quoi que ce soit, ce
     * qui est son comportement voulu hors ligne mais ne montre rien. Le bouton bascule
     * la valeur pour voir les deux états : un fichier qui tient dans un lot, et un
     * fichier qui n'y tient pas.
     */
    c.setQueryData(bddClientsKeys.parametres(), { exigerMontant: false, lotLignesMax: 500 });
    /*
     * Trois restaurants, pour que la section 4 soit atteignable.
     *
     * Sans eux, le pied de page s'arrête à « Choisis le restaurant » et l'on ne voit
     * jamais ce qu'il dit d'un fichier à plusieurs lots : c'est précisément l'état qu'on
     * vient regarder. La clé est celle que pose l'écran, sans quoi la requête partirait.
     */
    c.setQueryData(restaurantKeys.list({ limit: 300, page: 0 }), {
      content: [
        { id: 'r1', nomEtablissement: 'CHICKEN NATION ZONE 4' },
        { id: 'r2', nomEtablissement: 'TSUNAMI' },
        { id: 'r3', nomEtablissement: 'EM SHERIF DELI' },
      ],
      number: 0,
      size: 300,
      totalElements: 3,
      totalPages: 1,
    });
    return c;
  }, []);

  const collerTexte = (texte: string) => {
    const zone = document.querySelector('textarea');
    if (!zone) return;
    const donnees = new DataTransfer();
    donnees.setData('text/plain', texte);
    zone.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: donnees }),
    );
  };
  /*
   * ⚠ On écrit dans le cache, on n'échange PAS le client.
   *
   * Échanger le client remonterait l'arbre — TanStack lie l'observateur au client du
   * premier rendu — et le fichier collé disparaîtrait à chaque bascule, ce qui rend le
   * banc inutilisable pour ce qu'on vient y voir. Écrire la donnée notifie les
   * observateurs en place, et l'écran recalcule son découpage sans rien perdre.
   */
  React.useEffect(() => {
    client.setQueryData(bddClientsKeys.parametres(), {
      exigerMontant: false,
      lotLignesMax: plafond,
    });
  }, [client, plafond]);

  const coller = () => collerTexte(EXEMPLE);
  const collerGros = () => collerTexte(GROS);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Import de contacts</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={coller} size="sm" variant="secondary">
            Coller un exemple
          </Button>
          <Button onPress={() => collerGros()} size="sm" variant="secondary">
            Coller 1 200 lignes
          </Button>
          <Button onPress={() => setPlafond((p) => (p === 500 ? 50 : 500))} size="sm" variant="ghost">
            Lot de {plafond}
          </Button>
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Le contrôle et l&apos;enregistrement ne partent nulle part sur ce banc : la liste
        des restaurants est vide, et les boutons resteront inertes. La règle du serveur,
        elle, est semée : bascule-la pour voir un fichier qui tient dans un lot, et un
        fichier qui n&apos;y tient pas.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <QueryClientProvider client={client}>
          <ImportView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
