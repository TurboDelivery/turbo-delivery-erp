'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getVisaDgaApi, viserEtTransmettreApi, rejeterEtRenvoyerApi } from '../apis/visa-dga.api';

export const visaDgaKeys = {
  all: ['visa-dga'] as const,
  detail: (creneauId?: string) => [...visaDgaKeys.all, creneauId] as const,
};

export const useVisaDgaQuery = (creneauId?: string) => {
  const query = useQuery({
    queryKey: visaDgaKeys.detail(creneauId),
    queryFn: () => getVisaDgaApi(creneauId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors du chargement du visa DGA', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const useViserEtTransmettreMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creneauId: string) => viserEtTransmettreApi(creneauId),
    onSuccess: () => {
      toast.success('Visa DGA apposé — dossier transmis au PDG');
      queryClient.invalidateQueries({ queryKey: visaDgaKeys.all });
    },
    onError: (error) => {
      toast.error('Erreur lors de la transmission', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRejeterEtRenvoyerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creneauId, motif }: { creneauId: string; motif: string }) =>
      rejeterEtRenvoyerApi(creneauId, motif),
    onSuccess: () => {
      toast.success('Dossier rejeté et renvoyé à la comptabilité');
      queryClient.invalidateQueries({ queryKey: visaDgaKeys.all });
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
