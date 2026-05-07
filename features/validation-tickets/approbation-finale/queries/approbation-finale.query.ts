'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getApprobationFinaleApi,
  approuverEtDeclencherWaveApi,
  rejeterApprobationFinaleApi,
} from '../apis/approbation-finale.api';

export const approbationFinaleKeys = {
  all: ['approbation-finale'] as const,
  detail: (creneauId?: string) => [...approbationFinaleKeys.all, creneauId] as const,
};

export const useApprobationFinaleQuery = (creneauId?: string) => {
  const query = useQuery({
    queryKey: approbationFinaleKeys.detail(creneauId),
    queryFn: () => getApprobationFinaleApi(creneauId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors du chargement', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const useApprouverEtDeclencherWaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creneauId: string) => approuverEtDeclencherWaveApi(creneauId),
    onSuccess: () => {
      toast.success('Approbation finale — virements Wave déclenchés');
      queryClient.invalidateQueries({ queryKey: approbationFinaleKeys.all });
    },
    onError: (error) => {
      toast.error("Erreur lors de l'approbation", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRejeterApprobationFinaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creneauId, motif }: { creneauId: string; motif: string }) =>
      rejeterApprobationFinaleApi(creneauId, motif),
    onSuccess: () => {
      toast.success('Dossier rejeté et renvoyé');
      queryClient.invalidateQueries({ queryKey: approbationFinaleKeys.all });
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
