import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ticketsKeyQuery } from './index.query';
import { listerArchivesRequest } from '@/features/tickets/request/tickets.request';
import { IArchiveBonLivraisonVm, IArchivesParams } from '@/features/tickets/types/tickets.type';
import { PaginatedResponse } from '@/types/general';

export const ticketArchivesInfiniteQueryOption = (params: IArchivesParams) => ({
  queryKey: ticketsKeyQuery('archives', params),
  queryFn: async ({ pageParam }: { pageParam: number }) => {
    return await listerArchivesRequest({ ...params, page: pageParam });
  },
  staleTime: 60 * 1000,
  refetchOnMount: true,
  initialPageParam: 0,
  getNextPageParam: (lastPage: PaginatedResponse<IArchiveBonLivraisonVm>) => {
    const hasNext = lastPage.totalPages > lastPage.pageable.pageNumber + 1;
    return hasNext ? lastPage.pageable.pageNumber + 1 : undefined;
  },
  getPreviousPageParam: (firstPage: PaginatedResponse<IArchiveBonLivraisonVm>) => {
    const hasPrev = firstPage.pageable.pageNumber > 0;
    return hasPrev ? firstPage.pageable.pageNumber - 1 : undefined;
  },
});

export const useTicketArchivesInfiniteQuery = (params: IArchivesParams) => {
  const query = useInfiniteQuery(ticketArchivesInfiniteQueryOption(params));

  useEffect(() => {
    if (query.isError && query.error) {
      const message = query.error instanceof Error ? query.error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la récupération des archives: ${message}`);
    }
  }, [query.isError, query.error]);

  return query;
};
