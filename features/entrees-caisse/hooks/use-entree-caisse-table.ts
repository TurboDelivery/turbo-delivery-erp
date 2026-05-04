'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { format } from 'date-fns';
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

  // Filtre client-side sur le libellé
  const filteredData = useMemo(() => {
    const content = data?.content || [];
    if (!filters.search) return content;
    return content.filter((e) =>
      e.libelle.toLowerCase().includes(filters.search.toLowerCase()),
    );
  }, [data, filters.search]);

  const table = useReactTable({
    data: filteredData,
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

  const handleDateChange = (debut?: Date, fin?: Date) =>
    setFilters({
      debut: debut ?? filters.debut,
      fin: fin ?? filters.fin,
      page: 0,
    });

  const handleSearchChange = (search: string) => setFilters({ search, page: 0 });

  const handleReset = () => setFilters({ search: '', page: 0 });

  return {
    table,
    isLoading,
    isFetching,
    filters,
    setFilters,
    pagination,
    handleDateChange,
    handleSearchChange,
    handleReset,
  };
}
