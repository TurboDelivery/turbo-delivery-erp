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
    refetchInterval: 120_000,
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
    mutationFn: ({ lotId, userId }: { lotId: string; userId: string }) => viserEtTransmettreApi(lotId, userId),
    onSuccess: () => {
      toast.success('Visa DGA apposé — dossier transmis au PDG');
      queryClient.invalidateQueries({ queryKey: visaDgaKeys.all });
    },
    onError: (error) => {
      const axiosData = (error as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error('Erreur lors de la transmission', {
        description: axiosData?.message ?? (error instanceof Error ? error.message : 'Erreur inconnue'),
      });
    },
  });
};

export const useRejeterEtRenvoyerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, motif, userId }: { lotId: string; motif: string; userId: string }) =>
      rejeterEtRenvoyerApi(lotId, motif, userId),
    onSuccess: () => {
      toast.success('Dossier rejeté et renvoyé à la comptabilité');
      queryClient.invalidateQueries({ queryKey: visaDgaKeys.all });
    },
    onError: (error) => {
      const axiosData = (error as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error('Erreur lors du rejet', {
        description: axiosData?.message ?? (error instanceof Error ? error.message : 'Erreur inconnue'),
      });
    },
  });
};
