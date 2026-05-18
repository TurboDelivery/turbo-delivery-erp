import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  getAgentFactures,
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
};

function useCurrentUserSession() {
  const { data: session, status } = useSession();
  return {
    userId: session?.user?.id ?? '',
    role: session?.user?.role ?? '',
    sessionStatus: status,
  };
}

export function useAgentFacturesQuery(params?: IAgentFactureParams, agentIdOverride?: string) {
  const { userId, role, sessionStatus } = useCurrentUserSession();
  const isStandardAgent = role.toUpperCase() === 'STANDARD';
  // Admin/manager: no X-User-Id by default (backend returns all); STANDARD: always filter by own ID
  const defaultUserId = isStandardAgent ? userId : '';
  const effectiveUserId = agentIdOverride?.trim() || defaultUserId;

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

export function useEncaissementMutation(agentIdOverride?: string) {
  const { userId, role } = useCurrentUserSession();
  const isStandardAgent = role.toUpperCase() === 'STANDARD';
  const effectiveUserId = agentIdOverride?.trim() || (isStandardAgent ? userId : '');
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
  const { userId, role } = useCurrentUserSession();
  const isStandardAgent = role.toUpperCase() === 'STANDARD';
  const effectiveUserId = agentIdOverride?.trim() || (isStandardAgent ? userId : '');
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
  const { userId, role } = useCurrentUserSession();
  const isStandardAgent = role.toUpperCase() === 'STANDARD';
  const effectiveUserId = agentIdOverride?.trim() || (isStandardAgent ? userId : '');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ factureId, body }: { factureId: string; body: IVerserComptableBody }) =>
      patchVerserComptable(effectiveUserId, factureId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentRecouvreurKeys.all });
    },
  });
}

