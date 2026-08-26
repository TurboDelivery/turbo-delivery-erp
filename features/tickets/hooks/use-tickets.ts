import { useMemo } from 'react';
import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';
import { useTicketsInfiniteQuery } from '@/features/tickets/queries/ticket-infinite.query';
import { useDeleteBonLivraison, useUpdateBonLivraison } from '@/features/tickets/queries/tickets.mutation';
import { Restaurant } from '@/types/models';
import { useTicketEditing } from '@/features/tickets/hooks/use-ticket-editing';

export default function useTickets(restaurants: Restaurant[] = []) {
  const { filters, setFilter, resetFilters } = useTicketFilters();

  const currentSearchParams: ITicketParams = useMemo(() => ({
    page: filters.page,
    size: filters.size,
    search: filters.search,
    livreurId: filters.livreurId,
    restaurantId: filters.restaurantId,
    debut: filters.debut,
    fin: filters.fin,
  }), [filters]);

  const { data, isLoading, status, isFetching, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, hasNextPage, isError, error, refetch } =
    useTicketsInfiniteQuery(currentSearchParams);

  const { mutate: deleteBonLivraisonMutation, isPending: isDeletingBonLivraison } = useDeleteBonLivraison();
  const { mutate: updateBonLivraisonMutation, isPending: isUpdatingBonLivraison } = useUpdateBonLivraison();

  const ticketsRaw = useMemo(
    () => [...(data?.pages.flatMap((page) => page.content.map(bonLivraisonToTicket)) || [])],
    [data],
  );

  const totalItems = data?.pages[0]?.totalElements || 0;

  const editing = useTicketEditing({
    restaurants,
    ticketsData: ticketsRaw,
    updateBonLivraisonMutation,
  });

  return {
    filters,
    setFilter,
    resetFilters,
    ticketsData: ticketsRaw,
    isLoading,
    isError,
    error,
    infiniteState: { status, isFetching, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, hasNextPage, totalItems, refetch },
    mutations: { deleteBonLivraisonMutation, isDeletingBonLivraison, updateBonLivraisonMutation, isUpdatingBonLivraison },
    editing,
  };
}
