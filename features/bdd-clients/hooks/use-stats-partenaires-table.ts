'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { statsPartenairesColumns } from '@/components/bdd-clients/stats/stats-partenaires-table-columns';

import { useStatsPartenairesQuery } from '../queries/bdd-clients.query';

/**
 * L'instance du tableau des partenaires.
 *
 * <p>L'ordre vient du SERVEUR, par nombre de commandes décroissant : il a tout le jeu
 * sous la main, l'écran n'en a qu'une page. Trier ici ne trierait que ce qui est déjà
 * arrivé.</p>
 */
export default function useStatsPartenairesTable(
  debut: string,
  fin: string,
  onOuvrir: (id: string, nom: string) => void,
) {
  const { data, error, isLoading, refetch } = useStatsPartenairesQuery(debut, fin);

  const table = useReactTable({
    columns: statsPartenairesColumns,
    data: data ?? [],
    getCoreRowModel: getCoreRowModel(),
    meta: { onOuvrir },
  });

  return { error, isLoading, refetch, table, total: data?.length ?? 0 };
}
