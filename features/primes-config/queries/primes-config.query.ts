'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { primesConfigAPI } from '../apis/primes-config.api';
import { IUpdatePrimeConfig } from '../types/primes-config.types';

export const primesConfigKeys = {
  all: ['primes-config'] as const,
  config: () => [...primesConfigKeys.all, 'config'] as const,
};

export const usePrimeConfigQuery = () =>
  useQuery({
    queryKey: primesConfigKeys.config(),
    queryFn: () => primesConfigAPI.getConfig(),
    staleTime: 5 * 60 * 1000,
  });

export const useUpdatePrimeConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: IUpdatePrimeConfig) => primesConfigAPI.updateConfig(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(primesConfigKeys.config(), data);
      queryClient.invalidateQueries({ queryKey: primesConfigKeys.all });
      toast.success('Configuration prime enregistrée');
    },
    onError: (error) =>
      toast.error("Échec de l'enregistrement", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};
