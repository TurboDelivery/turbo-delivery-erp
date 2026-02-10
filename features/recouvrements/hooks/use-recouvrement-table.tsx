'use client';

import { useQueryStates } from 'nuqs';
import { recouvrementFiltersClient } from '../filters/recouvrement-filter.client';
import { useRecouvrementListQuery } from '../queries/recouvrement-list.query';
import { useMemo, useState } from 'react';
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { recouvrementColumns } from '../columns/recouvrement-columns';

export function useRecouvrementTable() {
  const [filters, setFilters] = useQueryStates(recouvrementFiltersClient.filter, recouvrementFiltersClient.option);
  
  const currentSearchParams = useMemo(() => {
    return {
      page: filters.page,
      size: filters.size,
      sort: filters.sort,
      search: filters.search,
      restaurantId: filters.restaurantId || undefined,
    };
  }, [filters]);

  const { data, isLoading, isError, isFetching } = useRecouvrementListQuery(currentSearchParams);


  const tableData = data?.content || [];

  const pagination = {
    pageCount: data?.totalPages || 1,
    page: filters.page,
    pageSize: filters.size,
    handlePageChange: (newPage: number) => setFilters({ page: newPage - 1 }),
  };

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: tableData,
    columns: recouvrementColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: pagination?.pageCount ?? -1,
  });

  return {
    table,
    isLoading,
    isError,
    isFetching,
    filters,
    setFilters,
    pagination,
    colsCount: recouvrementColumns.length,
  };
}



