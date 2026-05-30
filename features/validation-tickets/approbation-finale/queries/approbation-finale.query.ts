'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approuverEtDeclencherWaveApi,
  rejeterApprobationFinaleApi,
} from '../apis/approbation-finale.api';

export const approbationFinaleKeys = {
  all: ['approbation-finale'] as const,
  detail: (creneauId?: string) => [...approbationFinaleKeys.all, creneauId] as const,
};

export const useApprouverEtDeclencherWaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, userId }: { lotId: string; userId: string }) =>
      approuverEtDeclencherWaveApi(lotId, userId),
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
    mutationFn: ({ lotId, motif, userId }: { lotId: string; motif: string; userId: string }) =>
      rejeterApprobationFinaleApi(lotId, motif, userId),
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
