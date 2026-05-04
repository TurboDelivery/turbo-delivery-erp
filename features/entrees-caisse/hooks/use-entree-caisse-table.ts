'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { entreeCaisseFiltersClient } from '../filters/entree-caisse.filter';
import { useEntreeCaissePaginatedQuery } from '../queries/entree-caisse-paginated.query';
import { entreeCaisseColumns } from '../columns/entree-caisse-columns';

export function useEntreeCaisseTable() {
  const [filters, setFilters] = useQueryStates(
    entreeCaisseFiltersClient.filter,
    entreeCaisseFiltersClient.option,
  );

  const params = useMemo(
    () => ({
      page: filters.page,
      size: filters.size,
      debut: filters.debut ? format(filters.debut, 'yyyy-MM-dd') : undefined,
      fin: filters.fin ? format(filters.fin, 'yyyy-MM-dd') : undefined,
    }),
    [filters],
  );

  const { data, isLoading, isFetching } = useEntreeCaissePaginatedQuery(params);

  const table = useReactTable({
    data: data?.content || [],
    columns: entreeCaisseColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages || 0,
  });

  const pagination = {
    pageCount: data?.totalPages || 0,
    totalItems: data?.totalElements || 0,
    page: filters.page,
    handlePageChange: (newPage: number) => setFilters({ page: newPage - 1 }),
  };

  const handleDateChange = (range: DateRange | undefined) =>
    setFilters({
      debut: range?.from ?? null,
      fin: range?.to ?? null,
      page: 0,
    });

  const handleReset = () =>
    setFilters({ debut: null, fin: null, page: 0 });

  return {
    table,
    isLoading,
    isFetching,
    filters,
    setFilters,
    pagination,
    handleDateChange,
    handleReset,
  };
}
