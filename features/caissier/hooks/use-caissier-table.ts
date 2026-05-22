'use client';

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { IFactureCaissier } from '../types';
import { useCaissierFacturesQuery } from '../queries';
import type { ICaissierParams } from '../types';

export function useCaissierTable(
  columns: ColumnDef<IFactureCaissier>[],
  params: ICaissierParams,
) {
  const { data, isLoading, isFetching, isError, error } = useCaissierFacturesQuery(params);

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
