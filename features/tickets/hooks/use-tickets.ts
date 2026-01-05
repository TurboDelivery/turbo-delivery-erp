import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { useEffect, useMemo, useState } from 'react';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';
import { useTicketsInfiniteQuery } from '@/features/tickets/queries/ticket-infinite.query';
import { useCreateBonLivraison, useDeleteBonLivraison, useUpdateBonLivraison } from '@/features/tickets/queries/tickets.mutation';
import { Ticket } from '@/types/bon-livraison.model';

export default function useTickets() {
  const { filters, setFilter, resetFilters } = useTicketFilters();

  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const handleEditRow = (id: string) => {
    setEditingIds((prev) => new Set([...prev, id]));
  };

  const handleCancelEditRow = (id: string) => {
    setEditingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const currentSearchParams: ITicketParams = useMemo(() => {
    return {
      page: filters.page,
      size: filters.size,
      search: filters.search,
      livreurId: filters.livreurId,
      restaurantId: filters.restaurantId,
      debut: filters.debut,
      fin: filters.fin,
    };
  }, [filters]);

  const { data, isLoading, status, isFetching, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, hasNextPage, isError, error } = useTicketsInfiniteQuery(currentSearchParams);

  const { mutate: createBonLivraisonMutation, isPending: isCreatingBonLivraison } = useCreateBonLivraison();

  const { mutate: deleteBonLivraisonMutation, isPending: isDeletingBonLivraison } = useDeleteBonLivraison();

  const { mutate: updateBonLivraisonMutation, isPending: isUpdatingBonLivraison } = useUpdateBonLivraison();

  const ticketsRaw = useMemo(() => [...(data?.pages.flatMap((page) => page.content.map(bonLivraisonToTicket)) || [])], [data]);

  const totalItems = data?.pages[0]?.totalElements || 0;

  useEffect(() => {
    if (ticketsRaw && ticketsRaw.length > 0) {
      setTickets(ticketsRaw);
    }
  }, [ticketsRaw]);

  return {
    filters,
    setFilter,
    resetFilters,
    ticketsData: ticketsRaw,
    isLoading,
    isError,
    error,
    infiniteState: {
      status,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      fetchNextPage,
      hasNextPage,
      totalItems,
    },
    mutations: {
      createBonLivraisonMutation,
      isCreatingBonLivraison,
      deleteBonLivraisonMutation,
      isDeletingBonLivraison,
      updateBonLivraisonMutation,
      isUpdatingBonLivraison,
    },
    state: {
      editingIds,
      handleEditRow,
      handleCancelEditRow,
      tickets,
      setTickets
    },
  };
}
