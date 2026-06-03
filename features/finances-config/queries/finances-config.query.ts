'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { financesConfigAPI } from '../apis/finances-config.api';
import { IUpdateModuleConfig } from '../types/finances-config.types';

export const financesConfigKeys = {
  all: ['finances-config'] as const,
  config: () => [...financesConfigKeys.all, 'config'] as const,
};

export const useModuleConfigQuery = () =>
  useQuery({
    queryKey: financesConfigKeys.config(),
    queryFn: () => financesConfigAPI.getConfig(),
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateModuleConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: IUpdateModuleConfig) => financesConfigAPI.updateConfig(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(financesConfigKeys.config(), data);
      queryClient.invalidateQueries({ queryKey: financesConfigKeys.all });
      toast.success('Configuration enregistrée');
    },
    onError: (error) =>
      toast.error("Échec de l'enregistrement", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};
