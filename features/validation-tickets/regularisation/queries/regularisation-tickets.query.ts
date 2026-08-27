'use client';

import React from 'react';
import { useQuery , keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { StatutControle } from '@/types/statut-controle.enum';
import { regularisationKeyQuery } from './index.query';
import { listerTicketsParStatutCreneauMutation } from '@/features/validation-tickets/regularisation/mutations/regularisation.mutation';

export interface RegularisationTicketsQueryParams {
  statut: StatutControle;
  debut?: string;
  fin?: string;
  page: number;
  size: number;
}

/**
 * Liste paginée des tickets filtrés par statut et (optionnellement) par créneau.
 * Le créneau est traduit côté appelant en plage de dates debut/fin.
 * La clé commence par 'regularisation' afin d'être rafraîchie par
 * useInvalidateRegularisationQuery après une approbation / un rejet.
 */
export const useRegularisationTicketsQuery = (params: RegularisationTicketsQueryParams) => {
  const query = useQuery({
    queryKey: regularisationKeyQuery(
      'tickets',
      params.statut,
      params.debut ?? null,
      params.fin ?? null,
      params.page,
      params.size,
    ),
    queryFn: async () => {
      const result = await listerTicketsParStatutCreneauMutation(params);
      if (!result.success) throw new Error(result.error as string);
      return result.data!;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
