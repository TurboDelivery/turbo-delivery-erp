'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caissierAPI } from '../apis';
import type { ICaissierConfirmationBody, ICaissierParams, IDepotBanqueCaissierBody, IFactureCaissierListResponse } from '../types';

export const caissierKeys = {
  all: ['caissier'] as const,
  list: (params?: ICaissierParams) => [...caissierKeys.all, 'list', params] as const,
  statsParStatut: (params?: ICaissierParams) => [...caissierKeys.all, 'stats-par-statut', params] as const,
};

export function useCaissierFacturesQuery(params?: ICaissierParams) {
  return useQuery({
    queryKey: caissierKeys.list(params),
    queryFn: () => caissierAPI.obtenirFactures(params),
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Agrégat serveur pour les cartes de l'écran.
 *
 * <p>Rangé sous `caissierKeys.all` A DESSEIN : les deux mutations de ce module
 * invalident déjà cette racine, donc les cartes se rafraîchissent avec la liste dès
 * qu'une facture change de statut. Une clé à part les aurait laissées périmées après
 * chaque confirmation, ce qui est exactement le genre d'écart qu'on cherche à
 * supprimer ici.</p>
 */
export function useCaissierStatsParStatutQuery(params?: ICaissierParams) {
  return useQuery({
    queryKey: caissierKeys.statsParStatut(params),
    queryFn: () => caissierAPI.obtenirStatsParStatut(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useCaissierConfirmationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ICaissierConfirmationBody }) =>
      caissierAPI.confirmerReception(id, body),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: caissierKeys.all });
      const snapshot = queryClient.getQueriesData({ queryKey: caissierKeys.all });

      queryClient.setQueriesData(
        { queryKey: caissierKeys.all },
        (old: unknown) => {
          if (!old || typeof old !== 'object' || !('factures' in old)) return old;
          const response = old as IFactureCaissierListResponse;
          return {
            ...response,
            factures: {
              ...response.factures,
              content: response.factures.content.map((f) =>
                f.id === id ? { ...f, statut: 'En attente visa DGA' as const } : f, // /preuve → envoi DGA
              ),
            },
          };
        },
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caissierKeys.all });
      queryClient.invalidateQueries({ queryKey: ['responsable-financier'] });
    },
  });
}

export function useCaissierDepotBanqueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: IDepotBanqueCaissierBody }) =>
      caissierAPI.depotBanque(id, body),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: caissierKeys.all });
      const snapshot = queryClient.getQueriesData({ queryKey: caissierKeys.all });

      queryClient.setQueriesData(
        { queryKey: caissierKeys.all },
        (old: unknown) => {
          if (!old || typeof old !== 'object' || !('factures' in old)) return old;
          const response = old as IFactureCaissierListResponse;
          return {
            ...response,
            factures: {
              ...response.factures,
              content: response.factures.content.map((f) =>
                f.id === id ? { ...f, statut: 'Clôturé' as const } : f,
              ),
            },
          };
        },
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caissierKeys.all, refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['responsable-financier'], refetchType: 'none' });
    },
  });
}
