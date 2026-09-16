'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { restaurantColumns } from '@/components/restaurants/table/restaurant-table-columns';
import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { useRestaurantFilters } from '@/features/restaurants/hooks/use-restaurant-filters';
import { chargerPartenairesPourExport } from '@/features/restaurants/actions/restaurant.actions';
import { exporterRestaurantsExcel } from '@/features/restaurants/utils/restaurants-export.utils';
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

  const { data: restaurantsData, isLoading, error, isError, isFetching, refetch } = useRestaurantsListQuery(currentSearchParams);
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

  /**
   * Le fichier des partenaires.
   *
   * <h3>Les filtres viennent de `currentSearchParams`, et de nulle part ailleurs</h3>
   * <p>C'est le memo qui alimente DEJA le tableau. L'ancienne version lisait `filters.*`
   * directement : elle prenait donc le texte brut, non amorti, et divergeait du tableau
   * pendant les 350 ms du debounce. Surtout, elle ne transmettait PAS la vue `statut` :
   * exporter depuis la carte « Inactifs », qui affiche 2 lignes, aurait rendu les 71.</p>
   *
   * <h3>Trois issues, trois messages</h3>
   * <p>Un echec dit sa cause, une population vide le dit aussi, et une reussite nomme le
   * fichier produit. L'ancien `catch {}` ravalait tout dans un « Erreur lors de
   * l'exportation » qui n'a jamais permis a personne de comprendre que l'endpoint appele
   * n'existait pas.</p>
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const resultat = await chargerPartenairesPourExport({
        search: currentSearchParams.search,
        localisation: currentSearchParams.localisation,
        email: currentSearchParams.email,
        telephone: currentSearchParams.telephone,
        commune: currentSearchParams.commune,
        methodRecouvrement: currentSearchParams.methodRecouvrement,
        statut: currentSearchParams.statut,
        orderBy: currentSearchParams.orderBy,
        orderDirection: currentSearchParams.orderDirection,
      });

      if (!resultat.ok) {
        toast.error("L'export n'a pas abouti", { description: resultat.motif });
        return;
      }

      if (resultat.lignes.length === 0) {
        toast.warning('Rien à exporter', {
          description: 'Aucun partenaire ne correspond aux filtres en cours.',
        });
        return;
      }

      const nomFichier = exporterRestaurantsExcel(resultat.lignes, {
        commune: currentSearchParams.commune,
        email: currentSearchParams.email,
        localisation: currentSearchParams.localisation,
        methodRecouvrement: currentSearchParams.methodRecouvrement,
        orderBy: currentSearchParams.orderBy,
        orderDirection: currentSearchParams.orderDirection,
        recherche: currentSearchParams.search,
        telephone: currentSearchParams.telephone,
        vue: currentSearchParams.statut ?? '',
      });

      toast.success('Export terminé', {
        description: `${resultat.lignes.length} partenaires dans ${nomFichier}`,
      });
    } catch (erreur) {
      console.error('[export partenaires]', erreur);
      toast.error("L'export n'a pas abouti", {
        description:
          erreur instanceof Error ? erreur.message : 'Cause inconnue, voir la console du navigateur.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    table,
    isLoading,
    isError,
    isFetching,
    refetch,
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

