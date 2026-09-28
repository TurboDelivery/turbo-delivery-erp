'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ZonesView } from '@/components/bdd-clients/zones/zones-view';
import { bddClientsKeys, type ILibelleZone, type IZone } from '@/features/bdd-clients';

/**
 * Le banc des QUARTIERS.
 *
 * <p>Ce qu'on vient regarder : que la file de travail se lise — ce qui n'est pas tranché
 * en haut — et que « Aucune zone » se distingue de « à rapprocher ».</p>
 */

const ZONES: IZone[] = [
  { id: 'z1', libelle: 'Cocody-Angré' },
  { id: 'z2', libelle: 'Marcory-Zone 4' },
  { id: 'z3', libelle: 'Plateau' },
  { id: 'z4', libelle: 'Yopougon' },
];

const LIBELLES: ILibelleZone[] = [
  { arbitre: false, libelleNormalise: 'MARCORY RESIDENTIEL', libelleVu: 'Marcory Résidentiel', nbCaptures: 412, zone: null, zoneId: null },
  { arbitre: false, libelleNormalise: 'COCODY 2 PLATEAUX', libelleVu: 'COCODY 2 PLATEAUX', nbCaptures: 188, zone: null, zoneId: null },
  { arbitre: false, libelleNormalise: 'ANGRE 7EME TRANCHE', libelleVu: 'angre 7eme tranche', nbCaptures: 34, zone: null, zoneId: null },
  { arbitre: true, libelleNormalise: 'PLATEAU', libelleVu: 'Plateau', nbCaptures: 96, zone: 'Plateau', zoneId: 'z3' },
  { arbitre: true, libelleNormalise: 'A EMPORTER', libelleVu: 'à emporter', nbCaptures: 51, zone: null, zoneId: null },
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

export default function ApercuQuartiers() {
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
    c.setQueryData(bddClientsKeys.zones(), ZONES);
    c.setQueryData(bddClientsKeys.libellesDeZone(), vide ? [] : LIBELLES);
    return c;
  }, [vide]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Quartiers</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setVide((p) => !p)} size="sm" variant="ghost">
            {vide ? 'Avec libellés' : 'Rien de saisi'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Cache pré-rempli. Choisir une zone ne part nulle part sur ce banc.
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <QueryClientProvider client={client}>
          <ZonesView />
        </QueryClientProvider>
      </div>
    </main>
  );
}
