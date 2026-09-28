'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ImportView } from '@/components/bdd-clients/import/import-view';

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

  const client = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Infinity,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
    [],
  );

  const coller = () => {
    const zone = document.querySelector('textarea');
    if (!zone) return;
    const donnees = new DataTransfer();
    donnees.setData('text/plain', EXEMPLE);
    zone.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: donnees }),
    );
  };

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
        des restaurants est vide, et les deux boutons resteront inertes.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <QueryClientProvider client={client}>
          <ImportView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
