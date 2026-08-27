import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { factureTableColumns } from '@/components/finance/recouvrements/factures/facture-table-columns';
import { useFacturesParRestaurantQuery } from '@/features/recouvrements/queries/facture.query';
import { useMemo } from 'react';
import { IFactureParams } from '@/features/recouvrements/types/facture.types';
import { useQueryStates } from 'nuqs';
import { factureFiltersClient } from '@/features/recouvrements/filters/facture.filter';
import { subMonths } from 'date-fns';

interface UseFactureTableProps {
  restaurantId?: string; // Optionnel - peut être fourni en prop ou récupéré des filtres
}

function useFactureTable({ restaurantId: propRestaurantId }: UseFactureTableProps = {}) {
  const [filters, setFilters] = useQueryStates(factureFiltersClient.filter, factureFiltersClient.option);

  // Utiliser le restaurantId du prop si fourni, sinon celui des filtres
  const restaurantId = propRestaurantId || filters.restaurantId;

  const currentSearchParams: IFactureParams = useMemo(() => {
    return {
      restaurantId,
      page: filters.page,
      size: filters.size,
      type: filters.type || undefined,
      statut: filters.statut || undefined,
      periodeDebut: filters.periodeDebut || undefined,
      periodeFin: filters.periodeFin || undefined,
      sort: filters.sort || undefined,
    };
  }, [restaurantId, filters]);

  // Utiliser la query avec restaurantId (qui peut être vide)
  // refetch est expose pour que le tableau puisse proposer un bouton "Reessayer" sur echec
  const { data: facturesData, isLoading, isFetching, isError, refetch } = useFacturesParRestaurantQuery(restaurantId, currentSearchParams);

  // Gérer le tri
  const sorting: SortingState = useMemo(() => {
    if (!filters.sort) return [];
    const [id, direction] = filters.sort.split(',');
    return [{ id, desc: direction === 'desc' }];
  }, [filters.sort]);

  const setSorting = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;

    if (newSorting.length === 0) {
      setFilters({ sort: '' });
    } else {
      const sortStr = `${newSorting[0].id},${newSorting[0].desc ? 'desc' : 'asc'}`;
      setFilters({ sort: sortStr });
    }
  };

  const table = useReactTable({
    data: facturesData?.content || [],
    columns: factureTableColumns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: facturesData?.totalPages || 0,
  });

  const pagination = {
    pageCount: facturesData?.totalPages || 0,
    totalItems: facturesData?.totalElements || 0,
    page: filters.page,
    handlePageChange: (newPage: number) => {
      setFilters({ page: newPage - 1 }); // Convert from 1-based to 0-based
    },
  };

  const handleSizeChange = (newSize: number) => {
    setFilters({ size: newSize, page: 0 }); // Reset to first page when changing size
  };

  const handleRestaurantFilterChange = (id?: string | null) => {
    setFilters({ restaurantId: id || '', page: 0 });
  };

  const handleTypeFilterChange = (type?: string | null) => {
    setFilters({ type: type || '', page: 0 });
  };

  const handleStatutFilterChange = (statut?: string | null) => {
    setFilters({ statut: statut || '', page: 0 });
  };

  const handlePeriodeFilterChange = (debut?: Date, fin?: Date) => {
    setFilters({
      periodeDebut: debut ? new Date(debut) : subMonths(new Date(), 1),
      periodeFin: fin ? new Date(fin) : new Date(),
      page: 0,
    });
  };

  return {
    factureTable: table,
    factures: facturesData,
    isFactureLoading: isLoading,
    isFactureFetching: isFetching,
    isFactureError: isError,
    refetchFactures: refetch,
    pagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    restaurantId,
    handleSizeChange,
    handleRestaurantFilterChange,
    handleTypeFilterChange,
    handleStatutFilterChange,
    handlePeriodeFilterChange,
  };
}

export default useFactureTable;
