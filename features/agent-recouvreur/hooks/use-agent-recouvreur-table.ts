'use client';

import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useAgentFacturesQuery } from '../queries';
import type { IAgentFacture, IAgentFactureParams } from '../types';

// Options de sélection de lignes (encaissement en masse côté agent-recouvreur-view).
interface AgentTableSelectionOptions {
  state?: { rowSelection?: RowSelectionState };
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  enableRowSelection?: boolean | ((row: Row<IAgentFacture>) => boolean);
}

export function useAgentRecouvreurTable(
  columns: ColumnDef<IAgentFacture>[],
  params: IAgentFactureParams,
  agentIdOverride?: string,
  options?: AgentTableSelectionOptions,
) {
  const { data, error, isError, isFetching, isLoading, refetch } = useAgentFacturesQuery(params, agentIdOverride);

  // Backend renvoie directement une Page Spring "flat" {content, totalElements,
  // totalPages, size, number} — pas de wrap {factures: {...}}. Voir le record
  // AgentRecouvreurFacturePageVm côté Java.
  const table = useReactTable({
    data: data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    // id stable = id facture → la sélection survit aux refetch/optimistic updates.
    getRowId: (row) => row.id,
    enableRowSelection: options?.enableRowSelection,
    state: options?.state,
    onRowSelectionChange: options?.onRowSelectionChange,
  });

  return {
    table,
    isLoading,
    isFetching,
    isError,
    error,
    // `refetch` etait retenu par le hook : l'ecran affichait l'echec sans pouvoir
    // relancer la lecture, et il fallait recharger la page entiere.
    refetch,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
  };
}

export default useAgentRecouvreurTable;
