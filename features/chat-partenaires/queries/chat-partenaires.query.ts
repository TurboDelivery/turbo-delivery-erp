'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  consignerAppelAction,
  envoyerMessageAction,
  listerMessagesAction,
  listerNonLusAction,
  marquerLusAction,
} from '../actions/chat-partenaires.actions';
import { IConsignerAppelDTO, IEnvoyerMessageDTO } from '../types/chat-partenaires.types';

/** Cadence de rafraîchissement du chat : quasi temps réel sans websocket. */
export const CHAT_PARTENAIRES_REFRESH_MS = 15 * 1000;

export const chatPartenairesKeys = {
  all: ['chat-partenaires'] as const,
  nonLus: () => [...chatPartenairesKeys.all, 'non-lus'] as const,
  messages: (restaurantId: string) => [...chatPartenairesKeys.all, 'messages', restaurantId] as const,
};

/**
 * Compteurs de non-lus par partenaire. Rafraîchi en arrière-plan : le badge de
 * la console STANDARD doit bouger même quand l'onglet n'a pas le focus
 * (second moniteur, même logique que la file d'incidents).
 */
export const useNonLusQuery = (enabled = true) =>
  useQuery({
    queryKey: chatPartenairesKeys.nonLus(),
    queryFn: () => listerNonLusAction(),
    enabled,
    staleTime: CHAT_PARTENAIRES_REFRESH_MS,
    refetchInterval: CHAT_PARTENAIRES_REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

/**
 * Fil de conversation d'un partenaire. Infinie : la page 0 est le bas du fil
 * (messages les plus récents), « charger plus » remonte dans l'historique.
 * Le refetch périodique relit toutes les pages chargées — acceptable pour un
 * fil de conversation, et c'est ce qui fait apparaître les nouveaux messages.
 */
export const useMessagesQuery = (restaurantId: string | null) =>
  useInfiniteQuery({
    queryKey: chatPartenairesKeys.messages(restaurantId ?? ''),
    queryFn: ({ pageParam }) => listerMessagesAction(restaurantId as string, pageParam),
    enabled: !!restaurantId,
  initialPageParam: 0,
    getNextPageParam: (derniere, toutes) => (derniere.length > 0 ? toutes.length : undefined),
    staleTime: CHAT_PARTENAIRES_REFRESH_MS,
    refetchInterval: CHAT_PARTENAIRES_REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

export const useEnvoyerMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, dto }: { restaurantId: string; dto: IEnvoyerMessageDTO }) =>
      envoyerMessageAction(restaurantId, dto),
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: chatPartenairesKeys.messages(restaurantId) });
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Impossible d'envoyer le message", { description });
    },
  });
};

/**
 * Marque la conversation comme lue côté STANDARD. Silencieux en erreur : un
 * échec de marquage ne doit pas parasiter la lecture du fil (le badge se
 * resynchronisera au prochain rafraîchissement).
 */
export const useMarquerLusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => marquerLusAction(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatPartenairesKeys.nonLus() });
    },
  });
};

export const useConsignerAppelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, dto }: { restaurantId: string; dto: IConsignerAppelDTO }) =>
      consignerAppelAction(restaurantId, dto),
    onSuccess: (_data, { restaurantId }) => {
      // L'appel consigné apparaît souvent comme message SYSTEME dans le fil.
      queryClient.invalidateQueries({ queryKey: chatPartenairesKeys.messages(restaurantId) });
      toast.success('Appel consigné');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Impossible de consigner l'appel", { description });
    },
  });
};
