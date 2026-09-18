'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import CompteHabilitationPanel from '@/components/turboys/compte/compte-habilitation-panel';
import { compteLivreurKeys } from '@/features/turboys/queries/compte-livreur.queries';
import { turboyKeys } from '@/features/turboys/queries/turboy-list.query';

/**
 * Banc de l'onglet « Habilitation & pièces » d'un coursier.
 *
 * <p>Ce panneau ne rend RIEN sans données : ses gardes de chargement et d'erreur passent
 * avant toute section. Impossible de le regarder en le montant nu, et impossible de
 * l'atteindre autrement qu'en se connectant à l'ERP sur un vrai coursier.</p>
 *
 * <p>D'où le cache pré-rempli : le client de requêtes est créé ici avec les réponses déjà
 * posées sous les clés que le panneau interroge. Aucun appel réseau ne part, et l'écran se
 * rend en entier, sections comprises.</p>
 *
 * <p>Ce qu'on vient vérifier : la section « Code oublié », qui existait côté serveur et sur
 * une autre fiche coursier, mais pas sur celle que le menu Turboys ouvre.</p>
 */
const IDENTIFIANT = '00000000-0000-0000-0000-000000000001';

function clientPreRempli(deviceLie: boolean) {
  // `refetchOnMount: false` est la cle du banc : `useTurboyQuery` declare
  // `staleTime: 0`, qui l'emporte sur le defaut. La donnee semee est donc perimee des
  // le montage, et sans cela React Query part en reseau, echoue, et le panneau bascule
  // sur son etat d'erreur au bout d'une seconde. Vu a l'ecran.
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  client.setQueryData(turboyKeys.detail(IDENTIFIANT), {
    id: IDENTIFIANT,
    nom: 'KOUASSI',
    prenoms: 'Yao Martial',
    telephone: '+225 0707734800',
    email: null,
    status: 4,
    type: 'INDEPENDANT',
    typeLivreur: 'INDEPENDANT',
    cote: 100,
    cniStatut: 'CONFORME',
    ficheStatut: 'A_VERIFIER',
    contratStatut: 'A_VERIFIER',
    cniMotifRefus: null,
    ficheMotifRefus: null,
    contratMotifRefus: null,
    deviceId: deviceLie ? 'appareil-de-test' : null,
    deviceLabel: deviceLie ? 'Infinix HOT 30' : null,
  });

  client.setQueryData(compteLivreurKeys.cles(IDENTIFIANT), []);
  client.setQueryData(compteLivreurKeys.evenements(IDENTIFIANT), []);
  client.setQueryData(compteLivreurKeys.cote(IDENTIFIANT), { cote: 100, historique: [] });

  return client;
}

export default function ApercuCompteHabilitation() {
  // Créés une fois : un client neuf à chaque rendu reperdrait le cache pré-rempli.
  const avecAppareil = React.useMemo(() => clientPreRempli(true), []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
        <h1 className="text-xl font-semibold text-foreground">Habilitation &amp; pièces</h1>
        <p className="mt-1 text-sm text-muted">
          Cache pré-rempli, aucun appel réseau. On vient regarder la section « Code oublié »,
          en bas.
        </p>
      </div>

      <QueryClientProvider client={avecAppareil}>
        <div className="flex flex-col gap-6">
          <CompteHabilitationPanel driverId={IDENTIFIANT} />
        </div>
      </QueryClientProvider>
    </div>
  );
}
