import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { factureTableColumns } from '@/components/finance/recouvrements/factures/facture-table-columns';
import { useFacturesParRestaurantQuery } from '@/features/recouvrements/queries/facture.query';
import { useMemo } from 'react';
import { IFactureParams } from '@/features/recouvrements/types/facture.types';
import { useQueryStates } from 'nuqs';
import { factureFiltersClient } from '@/features/recouvrements/filters/facture.filter';

interface UseFactureTableProps {
  restaurantId: string;
}

function useFactureTable({ restaurantId }: UseFactureTableProps) {
  const [filters, setFilters] = useQueryStates(factureFiltersClient.filter, factureFiltersClient.option);

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

  const { data: facturesData, isLoading, isFetching, isError } = useFacturesParRestaurantQuery(restaurantId, currentSearchParams);

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
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
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

  const handleTypeFilterChange = (type?: string | null) => {
    setFilters({ type: type || '', page: 0 });
  };

  const handleStatutFilterChange = (statut?: string | null) => {
    setFilters({ statut: statut || '', page: 0 });
  };

  const handlePeriodeFilterChange = (debut?: string, fin?: string) => {
    setFilters({
      periodeDebut: debut || '',
      periodeFin: fin || '',
      page: 0
    });
  };

  return {
    factureTable: table,
    factures: facturesData,
    isFactureLoading: isLoading,
    isFactureFetching: isFetching,
    isFactureError: isError,
    pagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    handleSizeChange,
    handleTypeFilterChange,
    handleStatutFilterChange,
    handlePeriodeFilterChange,
  };
}

export default useFactureTable;
