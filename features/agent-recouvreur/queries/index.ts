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

export function useEncaissementMutation(agentIdOverride?: string) {
  const { effectiveUserId } = useEffectiveUserId(agentIdOverride);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body }: { factureId: string; body: IEncaissementBody }) =>
      postEncaissement(effectiveUserId, factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}

export function useDepotPartenaireMutation(agentIdOverride?: string) {
  const { effectiveUserId } = useEffectiveUserId(agentIdOverride);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body }: { factureId: string; body: IDepotPartenaireBody }) =>
      patchDepotPartenaire(effectiveUserId, factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}

export function useVersementCaissierMutation(agentIdOverride?: string) {
  const { effectiveUserId } = useEffectiveUserId(agentIdOverride);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body }: { factureId: string; body: IVersementCaissierBody }) =>
      patchVersementCaissier(effectiveUserId, factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}

/** @deprecated Utilisez useVersementCaissierMutation */
export const useVerserComptableMutation = useVersementCaissierMutation;
