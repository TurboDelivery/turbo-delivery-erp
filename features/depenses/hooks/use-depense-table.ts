import { useDepensesListQuery } from '@/feature-finance/depenses/queries/depense-list.query';
import { type GenericTableFilters } from '@/hooks/use-generic-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import React, { useMemo, useState } from 'react';
import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DepenseFilters extends GenericTableFilters {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[] | null;
}

const initialFilters: DepenseFilters = {
  categoriesDepense: null,
  limit: 20,
  page: 0,
  orderBy: undefined,
  orderDirection: 'desc',
};

export const useDepenseTable = () => {
  const [filters, setFilters] = useState<DepenseFilters>({
    ...initialFilters,
    debut: startOfMonth(new Date()),
    fin: new Date(),
  });

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

  const currentSearchParams = useMemo(() => {
    return {
      page: filters?.page ?? 0,
      limit: filters?.limit ?? 20,
      debut: filters.debut,
      fin: filters.fin,
      categorieIds: filters.categoriesDepense,
      orderBy: filters.orderBy,
      orderDirection: filters.orderDirection as 'asc' | 'desc' | undefined,
    };
  }, [filters?.page, filters?.limit, filters.debut, filters.fin, filters.categoriesDepense, filters.orderBy, filters.orderDirection]);

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

  // Synchroniser les filtres locaux avec les filtres globaux
  const syncedSetFilters = (fn: (prev: DepenseFilters) => DepenseFilters) => {
    const newFilters = fn(filters as unknown as DepenseFilters);
    setFilters(newFilters as typeof filters);
  };

  const setSelectedCategories = (categoryIds: string[] | null) => {
    syncedSetFilters((prev) => ({
      ...prev,
      categoriesDepense: categoryIds,
      page: 0, // Reset to first page when filters change
    }));
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev) => ({
        ...prev,
        debut: value.from,
        fin: value.to,
      }));
    }
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

  return {
    table,
    isLoading,
    isError,
    isFetching,
    setFilters: syncedSetFilters,
    depenses,
    depensesData,
    error,
    filters,
    setSelectedCategories,
    pagination,
    handleDateChange,
  };
};
