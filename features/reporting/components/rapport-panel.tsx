'use client';

import { useMemo, useState } from 'react';

import { useRapportPresenceQuery } from '@/features/reporting';
import { VueRapportPresence } from '@/features/reporting/refonte/vue-rapport-presence';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';

/**
 * Le rapport de présence par livreur (RG-21).
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/reporting/refonte/vue-rapport-presence.tsx`, qui porte le rendu. Ce fichier
 * ne fait plus que la lecture.</p>
 */
export function RapportPanel() {
  const livreursQuery = useLivreursListQuery();
  const [livreurId, setLivreurId] = useState<string | null>(null);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');

  const {
    data: rapport,
    isError,
    isFetching,
    refetch,
  } = useRapportPresenceQuery(livreurId, debut || undefined, fin || undefined);

  const livreurs = useMemo(
    () =>
      (livreursQuery.data ?? []).map((l) => ({
        id: l.id,
        nom: `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() || l.telephone || l.matricule || 'Livreur',
      })),
    [livreursQuery.data],
  );

  return (
    <VueRapportPresence
      debut={debut}
      fin={fin}
      isError={isError}
      isFetching={isFetching}
      livreurId={livreurId}
      livreurs={livreurs}
      livreursEnCours={livreursQuery.isLoading}
      onDebut={setDebut}
      onFin={setFin}
      onLivreur={setLivreurId}
      onReessayer={() => {
        void refetch();
      }}
      rapport={rapport}
    />
  );
}
