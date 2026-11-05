'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

import { VirementsView } from '@/components/finance/virements/virements-view';
import { AbilityContext } from '@/lib/casl/ability-context';
import { defineAbilityFor } from '@/lib/casl/ability';
import { virementsKeys } from '@/features/virements';

/**
 * Banc de l'écran « Recouvrement &gt; Virements reçus ».
 *
 * <p>L'écran ne rend rien d'utile sans données, et il n'est atteignable qu'en étant
 * connecté à l'ERP avec un payeur déjà créé. D'où le cache pré-rempli : aucun appel
 * réseau ne part, et chaque situation se regarde en entier.</p>
 *
 * <p>Ce qu'on vient vérifier : qu'une lecture en échec ne se lise pas « aucun virement »,
 * que le rôle sans droit de saisie ne voie aucun bouton, et que les montants s'alignent
 * en chasse tabulaire.</p>
 */

const PAYEUR = '00000000-0000-0000-0000-0000000000a1';
const AUTRE = '00000000-0000-0000-0000-0000000000a2';

const PAYEURS = [
  { id: PAYEUR, nom: 'Baobab Energy Côte d’Ivoire', banque: 'SGCI', actif: true, createdAt: '2026-01-05T08:00:00Z' },
  { id: AUTRE, nom: 'Debonairs Pizza SARL', banque: null, actif: true, createdAt: '2026-02-10T08:00:00Z' },
];

const VIREMENTS = [
  {
    id: 'v1', dateOperation: '2026-02-27', dateValeur: '2026-03-02',
    reference: 'MV55856', libelle: 'REGLEMENT FACT TURBO', montant: 909_500,
    payeurId: PAYEUR, justificatifUrl: 'https://exemple.test/capture.jpg',
    saisiPar: null, annule: false, annuleMotif: null, createdAt: '2026-02-27T10:00:00Z',
  },
  {
    id: 'v2', dateOperation: '2026-05-18', dateValeur: '2026-05-20',
    reference: 'MV61204', libelle: 'REGLEMENT FACTURES AVRIL', montant: 639_782,
    payeurId: PAYEUR, justificatifUrl: null,
    saisiPar: null, annule: false, annuleMotif: null, createdAt: '2026-05-18T10:00:00Z',
  },
  {
    id: 'v3', dateOperation: '2026-09-14', dateValeur: '2026-09-16',
    reference: 'MV70991', libelle: 'REGLEMENT FACT TURBO', montant: 670_260,
    payeurId: PAYEUR, justificatifUrl: null,
    saisiPar: null, annule: false, annuleMotif: null, createdAt: '2026-09-14T10:00:00Z',
  },
  {
    id: 'v4', dateOperation: '2026-10-02', dateValeur: '2026-10-03',
    reference: 'MV71550', libelle: 'SAISIE EN DOUBLE', montant: 120_000,
    payeurId: PAYEUR, justificatifUrl: null, saisiPar: null,
    annule: true, annuleMotif: 'Doublon de MV70991, confirmé par la banque le 03/10.',
    createdAt: '2026-10-02T10:00:00Z',
  },
];

type Scenario = 'garni' | 'vide' | 'echec' | 'sansDroit';

function client(scenario: Scenario) {
  // ⚠ `refetchOnMount: false` et `staleTime: Infinity` : sans eux, la donnée semée est
  // périmée dès le montage, React Query part en réseau, échoue, et le banc montre son
  // état d'erreur au bout d'une seconde — y compris dans les scénarios garnis.
  const c = new QueryClient({
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

  c.setQueryData(virementsKeys.payeurs(), PAYEURS);

  if (scenario === 'echec') {
    // On sème une ERREUR, pas un tableau vide : c'est toute la différence que l'écran
    // doit rendre visible.
    //
    // ⚠ PAS `setQueryData(cle, () => { throw ... })`. Une fonction passée à
    // `setQueryData` est un UPDATER : React Query l'exécute sur-le-champ, pendant le
    // rendu, et la levée remonte jusqu'à la frontière d'erreur. Le banc entier tombait
    // alors en 500 — vu à l'écran, pas déduit. L'état d'échec se pose sur l'entrée de
    // cache elle-même.
    const entree = c.getQueryCache().build(c, { queryKey: virementsKeys.liste([PAYEUR]) });
    entree.setState({
      data: undefined,
      error: new Error('503 Service indisponible'),
      errorUpdateCount: 1,
      errorUpdatedAt: Date.now(),
      fetchStatus: 'idle',
      status: 'error',
    } as never);
  } else {
    c.setQueryData(virementsKeys.liste([PAYEUR]), scenario === 'vide' ? [] : VIREMENTS);
  }
  return c;
}

const SCENARIOS: { cle: Scenario; titre: string; propos: string; role: string }[] = [
  {
    cle: 'garni', titre: 'Trois virements reçus, un annulé',
    propos: 'Les montants s’alignent à droite en chasse tabulaire. L’annulé garde sa ligne, avec son motif en info-bulle.',
    role: 'COMPTABLE',
  },
  {
    cle: 'vide', titre: 'Payeur sans aucun virement',
    propos: 'Le vide se NOMME : tant qu’il n’y a pas de virement, le relevé annonce que tout reste dû.',
    role: 'COMPTABLE',
  },
  {
    cle: 'echec', titre: 'La lecture a échoué',
    propos: 'Ne doit PAS se lire « aucun virement » : un agent en conclurait que rien n’a été réglé.',
    role: 'COMPTABLE',
  },
  {
    cle: 'sansDroit', titre: 'Rôle sans droit de saisie (Ops Manager)',
    propos: 'Aucun bouton de saisie, aucune action d’annulation. La section 8 exclut ce rôle de la saisie.',
    role: 'OPS_MANAGER',
  },
];

export default function ApercuVirements() {
  const [sombre, setSombre] = useState(false);

  // ⚠ Le thème se bascule sur <html>, jamais sur une enveloppe : les jetons shadcn sont
  // encore déclarés en triplets HSL bruts dans la portée `.dark`, et sur un div imbriqué
  // c'est le triplet qui gagne — les couleurs sémantiques ne peignent alors plus rien.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', sombre);
    return () => document.documentElement.classList.remove('dark');
  }, [sombre]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Banc — Virements reçus</h1>
            <p className="text-sm text-muted">
              Quatre situations. Aucun appel réseau ne part.
            </p>
          </div>
          <button
            className="rounded-lg border border-default-200 px-3 py-2 text-sm"
            onClick={() => setSombre((s) => !s)}
            type="button"
          >
            {sombre ? 'Passer en clair' : 'Passer en sombre'}
          </button>
        </header>

        {SCENARIOS.map((s) => (
          <section className="space-y-3" key={s.cle}>
            <div>
              <h2 className="text-base font-semibold">{s.titre}</h2>
              <p className="text-sm text-muted">{s.propos}</p>
            </div>
            <div className="rounded-xl border border-default-200 p-5">
              {/*
                * ⚠ La `key` est indispensable. Échanger le QueryClient ne réabonne pas les
                * composants déjà montés : sans une clé qui remonte l'arbre, les quatre
                * sections afficheraient toutes le cache de la première.
                */}
              <QueryClientProvider client={client(s.cle)} key={`${s.cle}-${sombre}`}>
                <AbilityContext.Provider value={defineAbilityFor(s.role as never)}>
                  <VirementsView payeurInitial={PAYEUR} />
                </AbilityContext.Provider>
              </QueryClientProvider>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
