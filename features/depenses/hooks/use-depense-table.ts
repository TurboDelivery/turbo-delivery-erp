import React from 'react';
import { useDepensesListQuery } from '@/feature-finance/depenses/queries/depense-list.query';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { getCoreRowModel, type SortingState, useReactTable } from '@tanstack/react-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';

export const useDepenseTable = () => {
  const { filters, setFilters } = useDepenseDashboardFilters();

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

  const currentSearchParams = {
    page: filters?.page ?? 0,
    limit: filters?.limit ?? 50,
    debut: filters.debut,
    fin: filters.fin,
    orderBy: sorting[0]?.id ?? filters.orderBy,
    orderDirection: sorting[0]?.desc ? 'desc' : ('asc' as 'asc' | 'desc' | undefined),
  };

  const { data: depensesData, isLoading, error, isError, isFetching } = useDepensesListQuery(currentSearchParams);

  const depenses = depensesData?.content || [];
  const pagination = {
    pageCount: depensesData?.totalPages || 0,
    totalItems: depensesData?.totalElements || 0,
    page: filters?.page ?? 0,
    handlePageChange: (page: number) => {
      setFilters((prev) => ({
        ...prev,
        page: page,
      }));
    },
  };

  const table = useReactTable({
    columns: depenseColumns,
    data: depenses,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: {
        pageIndex: pagination.page,
        pageSize: filters?.limit ?? 50,
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
        }));
        return next;
      });
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
      setFilters((prev) => ({
        ...prev,
        page: newState.pageIndex,
        limit: newState.pageSize,
      }));
    },
  });

  return { table, depenses: depensesData, isLoading, error, isError, filters, pagination, isFetching };
};
