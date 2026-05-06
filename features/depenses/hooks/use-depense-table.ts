import { useDepensesListQuery } from '@/features/depenses/queries/depense-list.query';
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
  typeDepense?: 'FIXE' | 'VARIABLE';
}

const initialFilters: DepenseFilters = {
  categoriesDepense: null,
  limit: 20,
  page: 0,
  orderBy: undefined,
  orderDirection: 'desc',
};

export const useDepenseTable = (externalFilters?: DepenseFilters) => {
  const [filters, setFilters] = useState<DepenseFilters>({
    ...initialFilters,
    debut: startOfMonth(new Date()),
    fin: new Date(),
  });

  // Utiliser les filtres externes s'ils sont fournis, sinon utiliser les filtres locaux
  const currentFilters = externalFilters || filters;

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
      page: currentFilters?.page ?? 0,
      limit: currentFilters?.limit ?? 20,
      debut: currentFilters.debut,
      fin: currentFilters.fin,
      // Envoyer les filtres de catégories au backend
      categoriesDepense: currentFilters.categoriesDepense || undefined,
      typeDepense: currentFilters.typeDepense,
      orderBy: currentFilters.orderBy,
      orderDirection: currentFilters.orderDirection as 'asc' | 'desc' | undefined,
    };
  }, [currentFilters?.page, currentFilters?.limit, currentFilters.debut, currentFilters.fin, currentFilters.categoriesDepense, currentFilters.typeDepense, currentFilters.orderBy, currentFilters.orderDirection]);

  const setTypeDepense = (typeDepense?: 'FIXE' | 'VARIABLE') => {
    syncedSetFilters((prev) => ({
      ...prev,
      typeDepense,
      page: 0,
    }));
  };

  const { data: allDepensesData, isLoading: allDepensesLoading, error, isError, isFetching } = useDepensesListQuery(currentSearchParams);
  const allDepenses = allDepensesData?.content || [];

  // Utiliser toujours la pagination API (pas de pagination locale)
  const pagination = useMemo(() => {
    return {
      pageCount: allDepensesData?.totalPages || 0,
      totalItems: allDepensesData?.totalElements || 0,
      page: currentFilters?.page ?? 0,
      handlePageChange: (page: number) => {
        if (!externalFilters) {
          setFilters((prev) => ({
            ...prev,
            page: page - 1,
          }));
        }
      },
    };
  }, [allDepensesData, currentFilters?.page, externalFilters, setFilters]);

  const isLoading = allDepensesLoading;

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
    data: allDepenses,
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
    depenses: allDepenses,
    depensesData: allDepensesData,
    error,
    filters: currentFilters,
    setSelectedCategories,
    setTypeDepense,
    pagination,
    handleDateChange,
  };
};

