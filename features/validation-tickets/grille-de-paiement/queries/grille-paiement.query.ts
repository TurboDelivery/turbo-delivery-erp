'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getGrillePaiementApi, soumettrGrillePaiementApi } from '../apis/grille-paiement.api';
import { IGrillePaiementParams } from '../types/grille-paiement.type';

export const grillePaiementKeys = {
  all: ['grille-paiement'] as const,
  detail: (params?: IGrillePaiementParams) => [...grillePaiementKeys.all, params] as const,
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
