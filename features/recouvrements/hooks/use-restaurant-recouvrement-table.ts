import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { restaurantRecouvrementTableColumns } from '@/components/finance/recouvrements/restaurants/restaurant-recouvrement-table-columns';
import { useRestaurantsRecouvrementQuery } from '@/features/recouvrements/queries/restaurants-recouvrement-list.qurey';
import { useQueryStates } from 'nuqs';
import { restaurantsRecouvrementFiltersClient } from '@/features/recouvrements/filters/recouvrement.filter';
import { useMemo } from 'react';
import { IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';

function useRestaurantRecouvrementTable() {
  const [filters, setFilters] = useQueryStates(restaurantsRecouvrementFiltersClient.filter, restaurantsRecouvrementFiltersClient.option);

  const currentSearchParams: IRestaurantRecouvrementSearchParams = useMemo(() => {
    return {
      page: filters.page,
      size: filters.limit,
      debut: filters.debut,
      fin: filters.fin,
      restaurantId: filters.restoId,
    };
  }, [filters]);

  const { data: restaurantsRecouvrements, isLoading, isFetching, isError, refetch } = useRestaurantsRecouvrementQuery(currentSearchParams);

  const table = useReactTable({
    data: restaurantsRecouvrements?.content || [],
    getCoreRowModel: getCoreRowModel(),
    columns: restaurantRecouvrementTableColumns,
  });

  const handleRestaurantFilterChange = (restaurantId?: string | null) => {
    setFilters((prev) => ({
      ...prev,
      restoId: restaurantId || '',
      page: 0,
    }));
  }

  const pagination = {
    pageCount: restaurantsRecouvrements?.totalPages || 0,
    totalItems: restaurantsRecouvrements?.totalElements || 0,
    page: filters?.page ?? 0,
    handlePageChange: (page: number) => {
      setFilters((prev) => ({
        ...prev,
        page: page - 1,
      }));
    },
  };

  return {
    restaurantTable: table,
    restaurants: restaurantsRecouvrements,
    isRestaurantLoading: isLoading,
    isRestaurantFetching: isFetching,
    // Sur echec la table retombe sur un tableau vide, indiscernable de « aucun
    // restaurant a recouvrer » : l'ecran doit pouvoir dire l'echec et relancer.
    isRestaurantError: isError,
    refetchRestaurants: refetch,
    pagination,
    filters,
    setFilters,
    handleRestaurantFilterChange,
  };
}

export default useRestaurantRecouvrementTable;
