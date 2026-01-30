/**
 * Hook générique pour gérer les tables avec filtres, tri et pagination
 * Basé sur le pattern de use-depense-table mais réutilisable
 */

import React from 'react';
import { getCoreRowModel, type SortingState, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { type PaginationState } from '@/components/block/data-table';

export interface GenericTableFilters {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface GenericTableResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

interface UseGenericTableProps<TData, TFilters extends GenericTableFilters> {
  columns: ColumnDef<TData>[];
  initialFilters: TFilters;
  queryResult: {
    data: GenericTableResponse<TData> | undefined;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
  };
}

/**
 * Hook générique pour gérer une table avec React Table
 *
 * @example
 * const { data, isLoading, isError, isFetching } = useDepensesListQuery({
 *   page: filters.page,
 *   limit: filters.limit,
 *   debut: filters.debut,
 *   fin: filters.fin,
 * });
 *
 * const { table, filters, setFilters, pagination } = useGenericTable({
 *   columns: depenseColumns,
 *   initialFilters: { page: 0, limit: 50, debut: '', fin: '' },
 *   queryResult: { data, isLoading, isError, isFetching },
 * });
 */
export const useGenericTable = <TData, TFilters extends GenericTableFilters>({
  columns,
  initialFilters,
  queryResult,
}: UseGenericTableProps<TData, TFilters>) => {
  const [filters, setFilters] = React.useState<TFilters>(initialFilters);

  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const orderBy = filters?.orderBy;
    const orderDirection = filters?.orderDirection ?? 'desc';
    return orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
  });

  React.useEffect(() => {
    const orderBy = filters?.orderBy;
    const orderDirection = filters?.orderDirection ?? 'desc';
    const next = orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
    setSorting((prev) => {
      const prevFirst = prev[0];
      const nextFirst = next[0];
      if (prevFirst?.id === nextFirst?.id && prevFirst?.desc === nextFirst?.desc) return prev;
      return next;
    });
  }, [filters?.orderBy, filters?.orderDirection]);

  const responseData = React.useMemo(() => queryResult.data?.content || [], [queryResult.data?.content]);

  const pagination: PaginationState = React.useMemo(
    () => ({
      pageCount: queryResult.data?.totalPages || 0,
      totalItems: queryResult.data?.totalElements || 0,
      page: filters.page,
      handlePageChange: (page: number) => {
        setFilters((prev) => ({
          ...prev,
          page: page - 1,
        } as TFilters));
      },
    }),
    [queryResult.data?.totalPages, queryResult.data?.totalElements, filters.page, setFilters],
  );

  const table = useReactTable({
    columns,
    data: responseData,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: {
        pageIndex: pagination.page,
        pageSize: filters.limit,
      },
      sorting,
    },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const first = next[0];
        setFilters((prevFilters) => ({
          ...prevFilters,
          orderBy: first?.id ?? undefined,
          orderDirection: first ? (first.desc ? 'desc' : 'asc') : undefined,
          page: 0,
        } as TFilters));
        return next;
      });
    },
  });

  return {
    table,
    filters,
    setFilters,
    pagination,
    sorting,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    isFetching: queryResult.isFetching,
    data: responseData,
  };
};
