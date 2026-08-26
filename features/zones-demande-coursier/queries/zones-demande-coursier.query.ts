'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { priceListKeys } from '@/features/price-list/queries/price-list.query';
import { getZoneHistorique, updateZoneActif } from '../actions/zones-demande-coursier.action';

export const zonesDemandeCoursierKeys = {
  all: ['zones-demande-coursier'] as const,
  historique: (fraisId: string) => [...zonesDemandeCoursierKeys.all, 'historique', fraisId] as const,
};

export const useZoneHistoriqueQuery = (fraisId: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: zonesDemandeCoursierKeys.historique(fraisId ?? ''),
    queryFn: () => getZoneHistorique(fraisId!),
    enabled: enabled && !!fraisId,
    staleTime: 60 * 1000,
  });
};

export const useUpdateZoneActifMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fraisId, actif }: { fraisId: string; actif: boolean }) => {
      const result = await updateZoneActif(fraisId, actif);
      if (result.status === 'error') throw new Error(result.message);
      return result;
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: priceListKeys.all });
      toast.success(variables.actif ? 'Zone activée avec succès' : 'Zone désactivée avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};
