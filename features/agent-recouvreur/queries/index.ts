import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  getAgentFactures,
  getAgentFacturesStats,
  postEncaissement,
  patchDepotPartenaire,
  patchVersementCaissier,
} from '../apis';
import type {
  IAgentFactureApiResponse,
  IAgentFactureParams,
  IEncaissementBody,
  IDepotPartenaireBody,
  IVersementCaissierBody,
} from '../types';

export const agentRecouvreurKeys = {
  all: ['agent-recouvreur'] as const,
  list: (params?: IAgentFactureParams) =>
    [...agentRecouvreurKeys.all, 'list', params] as const,
  stats: (params?: IAgentFactureParams) =>
    [...agentRecouvreurKeys.all, 'stats', params] as const,
};

function useCurrentUserSession() {
  const { data: session, status } = useSession();
  return {
    userId: session?.user?.id ?? '',
    role: session?.user?.role ?? '',
    sessionStatus: status,
  };
}

function useEffectiveUserId(agentIdOverride?: string) {
  const { userId, role, sessionStatus } = useCurrentUserSession();
  const normalizedRole = role.toUpperCase().trim();
  const isAgent = ['STANDARD', 'RECOUVREUR', 'AGENT RECOUVREUR'].includes(normalizedRole);
  const defaultUserId = isAgent ? userId : '';
  const effectiveUserId = agentIdOverride?.trim() || defaultUserId;
  return { effectiveUserId, isAgent, sessionStatus };
}

export function useAgentFacturesQuery(params?: IAgentFactureParams, agentIdOverride?: string) {
  const { effectiveUserId, isAgent, sessionStatus } = useEffectiveUserId(agentIdOverride);

  const query = useQuery({
    queryKey: [...agentRecouvreurKeys.list(params), effectiveUserId],
    queryFn: () => getAgentFactures(effectiveUserId, params),
    enabled: sessionStatus === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });
  return {
    ...query,
    isLoading: sessionStatus === 'loading' || query.isLoading,
  };
}

export function useAgentFacturesStatsQuery(
  params?: IAgentFactureParams,
  agentIdOverride?: string,
) {
  const { effectiveUserId, isAgent, sessionStatus } = useEffectiveUserId(agentIdOverride);

  const query = useQuery({
    queryKey: [...agentRecouvreurKeys.stats(params), effectiveUserId],
    queryFn: () => getAgentFacturesStats(effectiveUserId, params),
    enabled: sessionStatus === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });
  return {
    ...query,
    isLoading: sessionStatus === 'loading' || query.isLoading,
  };
}

export function useEncaissementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body, agentIdOverride }: { factureId: string; body: IEncaissementBody; agentIdOverride?: string }) =>
      postEncaissement(agentIdOverride ?? '', factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}

export function useDepotPartenaireMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body, agentIdOverride }: { factureId: string; body: IDepotPartenaireBody; agentIdOverride?: string }) =>
      patchDepotPartenaire(agentIdOverride ?? '', factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}

export function useVersementCaissierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body, agentIdOverride }: { factureId: string; body: IVersementCaissierBody; agentIdOverride?: string }) =>
      patchVersementCaissier(agentIdOverride ?? '', factureId, body),
    onMutate: async ({ factureId }) => {
      // Cancel in-flight fetches to avoid overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: agentRecouvreurKeys.all });

      // Snapshot current cache for rollback on error
      const snapshot = queryClient.getQueriesData({ queryKey: agentRecouvreurKeys.all });

      // Optimistically flip the facture status → button changes immediately
      queryClient.setQueriesData(
        { queryKey: agentRecouvreurKeys.all },
        (old: unknown) => {
          if (!old || typeof old !== 'object' || !('content' in old)) return old;
          const response = old as IAgentFactureApiResponse;
          return {
            ...response,
            content: response.content.map((f) =>
              f.id === factureId ? { ...f, statut: 'Versé au caissier' as const } : f,
            ),
          };
        },
      );

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: (data, _vars, context) => {
      // Vérifier si le statut a réellement changé côté serveur.
      // Si le backend retourne 200 mais n'a pas mis à jour la DB (bug facture_type_check),
      // le body contiendra le statut inchangé → on rollback l'update optimiste.
      if (data && 'statut' in data && data.statut !== 'Versé au caissier') {
        context?.snapshot.forEach(([key, d]) => {
          queryClient.setQueryData(key, d);
        });
        queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
      }
    },
    onSettled: () => {
      // Marquer comme stale sans refetch immédiat — évite d'écraser l'update optimiste
      // quand le backend retourne 200 mais ne met pas encore à jour le statut en DB.
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all, refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['responsable-financier'], refetchType: 'none' });
    },
  });
}

/** @deprecated Utilisez useVersementCaissierMutation */
export const useVerserComptableMutation = useVersementCaissierMutation;
