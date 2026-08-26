'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { restaurantColumns } from '@/components/restaurants/table/restaurant-table-columns';
import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { useRestaurantFilters } from '@/features/restaurants/hooks/use-restaurant-filters';
import { exportRestaurantsPDF } from '@/features/restaurants/actions/restaurant.actions';
import { saveAsPDFFile } from '@/utils/reporting-file';
import { toast } from 'sonner';

const DEBOUNCE_MS = 350;

export const useRestaurantTable = () => {
  const { filters, setFilters } = useRestaurantFilters();
  const [isExporting, setIsExporting] = useState(false);

  // Debounce des champs texte pour éviter une requête à chaque frappe
  const [debouncedFilters, setDebouncedFilters] = useState({
    search: filters.search,
    localisation: filters.localisation,
    email: filters.email,
    telephone: filters.telephone,
    commune: filters.commune,
  });

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedFilters({
        search: filters.search,
        localisation: filters.localisation,
        email: filters.email,
        telephone: filters.telephone,
        commune: filters.commune,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [filters.search, filters.localisation, filters.email, filters.telephone, filters.commune]);

  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const orderBy = filters.orderBy;
    const orderDirection = filters.orderDirection ?? 'asc';
    return orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
  });

  // Synchroniser le sorting avec les filtres
  React.useEffect(() => {
    const orderBy = filters.orderBy;
    const orderDirection = filters.orderDirection ?? 'asc';
    const next = orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
    setSorting((prev) => {
      const prevFirst = prev[0];
      const nextFirst = next[0];
      if (prevFirst?.id === nextFirst?.id && prevFirst?.desc === nextFirst?.desc) return prev;
      return next;
    });
  }, [filters.orderBy, filters.orderDirection]);

  const currentSearchParams = useMemo(() => {
    return {
      page: filters.page ?? 0,
      limit: filters.limit ?? 10,
      search: debouncedFilters.search || undefined,
      orderBy: filters.orderBy || undefined,
      orderDirection: filters.orderDirection as 'asc' | 'desc' | undefined,
      localisation: debouncedFilters.localisation || undefined,
      email: debouncedFilters.email || undefined,
      telephone: debouncedFilters.telephone || undefined,
      commune: debouncedFilters.commune || undefined,
      methodRecouvrement: filters.methodRecouvrement || undefined,
      statut: filters.statut || undefined,
    };
  }, [filters.page, filters.limit, debouncedFilters.search, filters.orderBy, filters.orderDirection,
      debouncedFilters.localisation, debouncedFilters.email, debouncedFilters.telephone, debouncedFilters.commune, filters.methodRecouvrement, filters.statut]);

  const { data: restaurantsData, isLoading, error, isError, isFetching } = useRestaurantsListQuery(currentSearchParams);
  const restaurants = restaurantsData?.content || [];

  const pagination = {
    pageCount: restaurantsData?.totalPages || 0,
    totalItems: restaurantsData?.totalElements || 0,
    page: filters.page ?? 0,
    handlePageChange: (page: number) => {
      setFilters((prev) => ({
        ...prev,
        page: page - 1,
      }));
    },
  };

  const table = useReactTable({
    columns: restaurantColumns,
    data: restaurants,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: {
        pageIndex: pagination.page,
        pageSize: filters.limit ?? 10,
      },
      sorting,
    },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const first = next[0];
        setFilters((prevFilters) => ({
          ...prevFilters,
          orderBy: first?.id ?? 'nomEtablissement',
          orderDirection: first ? (first.desc ? 'desc' : 'asc') : 'asc',
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

  const setSearch = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      page: 0,
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const buffer = await exportRestaurantsPDF({
        search: filters.search || undefined,
        nomEtablissement: filters.search || undefined,
        localisation: filters.localisation || undefined,
        email: filters.email || undefined,
        telephone: filters.telephone || undefined,
        commune: filters.commune || undefined,
        methodRecouvrement: filters.methodRecouvrement || undefined,
      });
      if (buffer) {
        saveAsPDFFile(new Uint8Array(buffer), 'restaurants');
      } else {
        toast.error("Erreur lors de l'exportation");
      }
    } catch {
      toast.error("Erreur lors de l'exportation");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    table,
    isLoading,
    isError,
    isFetching,
    isExporting,
    setFilters,
    restaurants,
    restaurantsData,
    error,
    filters,
    pagination,
    setSearch,
    handleExport,
  };
};

