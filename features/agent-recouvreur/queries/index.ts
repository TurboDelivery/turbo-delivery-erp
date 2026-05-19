import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  getAgentFactures,
  getAgentFacturesStats,
  postEncaissement,
  patchDepotPartenaire,
  patchVerserComptable,
} from '../apis';
import type {
  IAgentFactureParams,
  IEncaissementBody,
  IDepotPartenaireBody,
  IVerserComptableBody,
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
  const isStandardAgent = role.toUpperCase() === 'STANDARD';
  const defaultUserId = isStandardAgent ? userId : '';
  const effectiveUserId = agentIdOverride?.trim() || defaultUserId;
  return { effectiveUserId, isStandardAgent, sessionStatus };
}

export function useAgentFacturesQuery(params?: IAgentFactureParams, agentIdOverride?: string) {
  const { effectiveUserId, isStandardAgent, sessionStatus } = useEffectiveUserId(agentIdOverride);

  const query = useQuery({
    queryKey: [...agentRecouvreurKeys.list(params), effectiveUserId],
    queryFn: () => getAgentFactures(effectiveUserId, params),
    enabled: sessionStatus === 'authenticated' && (!isStandardAgent || !!effectiveUserId),
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
  const { effectiveUserId, isStandardAgent, sessionStatus } = useEffectiveUserId(agentIdOverride);

  const query = useQuery({
    queryKey: [...agentRecouvreurKeys.stats(params), effectiveUserId],
    queryFn: () => getAgentFacturesStats(effectiveUserId, params),
    enabled: sessionStatus === 'authenticated' && (!isStandardAgent || !!effectiveUserId),
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

export function useVerserComptableMutation(agentIdOverride?: string) {
  const { effectiveUserId } = useEffectiveUserId(agentIdOverride);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body }: { factureId: string; body: IVerserComptableBody }) =>
      patchVerserComptable(effectiveUserId, factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}
