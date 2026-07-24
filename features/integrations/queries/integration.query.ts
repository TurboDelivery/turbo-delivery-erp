'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  enregistrerWebhookApi,
  getCleApiApi,
  getIntegrationLogsApi,
  listerWebhooksApi,
  modifierWebhookApi,
  supprimerWebhookApi,
  type IIntegrationLogsParams,
} from '../apis/integration.api';

const serverMsg = (error: any) =>
  String(error?.response?.data?.message ?? error?.response?.data ?? error?.message ?? 'Erreur inconnue');

// ─── Clé API ────────────────────────────────────────────────────────────────

export const useCleApiQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: ['integration-cle-api', restaurantId ?? ''],
    queryFn: () => getCleApiApi(restaurantId as string),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });

// ─── Webhooks ─────────────────────────────────────────────────────────────────

const webhooksKey = (restaurantId?: string) => ['integration-webhooks', restaurantId ?? ''] as const;

export const useWebhooksQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: webhooksKey(restaurantId),
    queryFn: () => listerWebhooksApi(restaurantId as string),
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
  });

export const useEnregistrerWebhookMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { url: string; description?: string }) =>
      enregistrerWebhookApi({ restaurantId, ...payload }),
    onSuccess: () => {
      toast.success('Webhook ajouté');
      queryClient.invalidateQueries({ queryKey: webhooksKey(restaurantId) });
    },
    onError: (error: any) => toast.error('Ajout impossible', { description: serverMsg(error) }),
  });
};

export const useModifierWebhookMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, url, description }: { id: string; url: string; description?: string }) =>
      modifierWebhookApi(id, { url, description }),
    onSuccess: () => {
      toast.success('Webhook modifié');
      queryClient.invalidateQueries({ queryKey: webhooksKey(restaurantId) });
    },
    onError: (error: any) => toast.error('Modification impossible', { description: serverMsg(error) }),
  });
};

export const useSupprimerWebhookMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerWebhookApi(id),
    onSuccess: () => {
      toast.success('Webhook supprimé');
      queryClient.invalidateQueries({ queryKey: webhooksKey(restaurantId) });
    },
    onError: (error: any) => toast.error('Suppression impossible', { description: serverMsg(error) }),
  });
};

// ─── Journal des appels réseau ────────────────────────────────────────────────

export const useIntegrationLogsQuery = (params: IIntegrationLogsParams) =>
  useQuery({
    queryKey: [
      'integration-logs',
      params.restaurantId ?? '',
      params.direction ?? '',
      params.succes ?? '',
      params.page ?? 0,
      params.size ?? 20,
    ],
    queryFn: () => getIntegrationLogsApi(params),
    enabled: !!params.restaurantId,
    staleTime: 10 * 1000,
    // Rafraîchit régulièrement pour une supervision « live » des appels réseau.
    refetchInterval: 20 * 1000,
  });
