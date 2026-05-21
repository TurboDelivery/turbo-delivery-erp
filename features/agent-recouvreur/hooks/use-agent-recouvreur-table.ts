'use client';

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useAgentFacturesQuery } from '../queries';
import type { IAgentFacture, IAgentFactureParams } from '../types';

export function useAgentRecouvreurTable(
  columns: ColumnDef<IAgentFacture>[],
  params: IAgentFactureParams,
  agentIdOverride?: string,
) {
  const { data, isLoading, isFetching, isError, error } = useAgentFacturesQuery(params, agentIdOverride);

  const table = useReactTable({
    data: data?.factures?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.factures?.totalPages ?? -1,
  });

  return {
    table,
    isLoading,
    isFetching,
    isError,
    error,
    totalElements: data?.factures?.totalElements ?? 0,
    totalPages: data?.factures?.totalPages ?? 0,
  };
}

export default useAgentRecouvreurTable;
