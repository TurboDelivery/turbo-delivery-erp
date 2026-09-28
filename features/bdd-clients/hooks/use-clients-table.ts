'use client';

import React from 'react';
import { RowSelectionState, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { clientsColumns } from '@/components/bdd-clients/liste/clients-table-columns';

import { useClientsQuery } from '../queries/bdd-clients.query';
import { useBddClientsFilters } from './use-bdd-clients-filters';

/**
 * L'instance du tableau vit dans ce hook, pas dans le composant.
 *
 * <p>C'est la convention du dépôt, et elle a une raison : le composant de rendu reste
 * alors une fonction du seul `table`, et le banc peut le monter sans réseau.</p>
 *
 * <p>Le tri et la pagination sont côté SERVEUR (`manualPagination`) : la base peut
 * atteindre des dizaines de milliers de fiches, et trier une page de vingt-cinq lignes
 * dans le navigateur trierait vingt-cinq lignes au lieu de la base.</p>
 */
export function useClientsTable(onOuvrir: (id: string) => void) {
  const { filtres, setFiltres } = useBddClientsFilters();
  const { data, isError, isFetching, isLoading, refetch } = useClientsQuery(filtres);

  const [selection, setSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    columns: clientsColumns,
    data: data?.content ?? [],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (ligne) => ligne.id,
    manualPagination: true,
    manualSorting: true,
    meta: { onOuvrir },
    onRowSelectionChange: setSelection,
    pageCount: data?.totalPages ?? 0,
    state: { rowSelection: selection },
  });

  /*
   * ⚠ `getRowId` rend l'identifiant de la FICHE, pas l'index de ligne.
   *
   * Par defaut TanStack indexe la selection par position. En pagination serveur, la
   * ligne 0 de la page 2 n'est pas la ligne 0 de la page 1 : changer de page aurait
   * garde « la premiere ligne cochee » et pose l'etiquette sur quelqu'un d'autre.
   *
   * ⚠ MEMOISE, et ce n'est pas une elegance. Recalcule a chaque rendu, ce tableau est
   * une nouvelle reference a chaque fois ; passe en dependance d'un effet, il le
   * relance indefiniment. Mesure a l'ecran : React error #185, « Maximum update depth
   * exceeded », et la page entiere en 500 alors que le build etait vert.
   */
  const selectionnes = React.useMemo(
    () => Object.keys(selection).filter((id) => selection[id]),
    [selection],
  );

  const viderLaSelection = React.useCallback(() => setSelection({}), []);

  return {
    // ⚠ setFiltres, PAS poser : poser remet la page a zero, c'est son role quand un
    // filtre change. L'utiliser ici rendait la pagination inerte — cliquer « page
    // suivante » ecrivait page 1 puis 0 dans le meme geste, et l'on restait page 1 sur 52.
    allerA: (page: number) => setFiltres({ page }),
    isError,
    isFetching,
    isLoading,
    page: data?.number ?? 0,
    refetch,
    table,
    selectionnes,
    total: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    viderLaSelection,
  };
}
