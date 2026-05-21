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

  // Backend renvoie directement une Page Spring "flat" {content, totalElements,
  // totalPages, size, number} — pas de wrap {factures: {...}}. Voir le record
  // AgentRecouvreurFacturePageVm côté Java.
  const table = useReactTable({
    data: data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
  });

  return {
    table,
    isLoading,
    isFetching,
    isError,
    error,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
  };
}

export default useAgentRecouvreurTable;
