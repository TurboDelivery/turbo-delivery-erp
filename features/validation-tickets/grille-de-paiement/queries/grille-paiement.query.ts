'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getGrillePaiementApi, soumettrGrillePaiementApi, updateNumeroWaveApi } from '../apis/grille-paiement.api';
import { IGrillePaiementParams, IUpdateNumeroWaveParams } from '../types/grille-paiement.type';

export const grillePaiementKeys = {
  all: ['grille-paiement'] as const,
  detail: (params?: IGrillePaiementParams) => [...grillePaiementKeys.all, params?.creneauId, params?.page ?? 0] as const,
};

export const useGrillePaiementQuery = (params?: IGrillePaiementParams) => {
  const query = useQuery({
    queryKey: grillePaiementKeys.detail(params),
    queryFn: () => getGrillePaiementApi(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors du chargement de la grille de paiement', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const useSoumettreGrilleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, userId }: { lotId: string; userId: string }) =>
      soumettrGrillePaiementApi(lotId, userId),
    onSuccess: () => {
      toast.success('Grille soumise au DGA avec succès');
      queryClient.invalidateQueries({ queryKey: grillePaiementKeys.all });
    },
    onError: (error) => {
      toast.error('Erreur lors de la soumission', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useUpdateNumeroWaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IUpdateNumeroWaveParams) => updateNumeroWaveApi(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grillePaiementKeys.all });
      toast.success('Numéro Wave mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du numéro Wave', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
