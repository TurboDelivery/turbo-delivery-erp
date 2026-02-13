'use client';

import { useQuery } from '@tanstack/react-query';
import { obtenirContestationsListRequest } from '@/features/recouvrements/requests/contestations.request';
import { IContestationSearchParams } from '@/features/recouvrements/types';
import { contestationsKeyQuery } from './index.query';

// Hook pour récupérer la liste paginée des contestations d'une facture
export const useContestationsQuery = (params: IContestationSearchParams) => {
  return useQuery({
    queryKey: contestationsKeyQuery('list', params),
    queryFn: () => obtenirContestationsListRequest(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
