'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

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
  const { filtres, poser } = useBddClientsFilters();
  const { data, isError, isFetching, isLoading, refetch } = useClientsQuery(filtres);

  const table = useReactTable({
    columns: clientsColumns,
    data: data?.content ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    meta: { onOuvrir },
    pageCount: data?.totalPages ?? 0,
  });

  return {
    allerA: (page: number) => poser({ page }),
    isError,
    isFetching,
    isLoading,
    page: data?.number ?? 0,
    refetch,
    table,
    total: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
  };
}
