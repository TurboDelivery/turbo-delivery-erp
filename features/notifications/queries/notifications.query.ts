'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllNotifications,
  fetchUnreadNotifications,
  fetchUnreadCount,
  fetchNotificationDetail,
  markAsRead,
  markAllAsRead,
} from '@/features/notifications/actions/notifications.actions';

/**
 * Query keys factory + hooks TanStack pour notifications.
 *
 * Patterns alignés avec features/restaurants/queries/restaurant-list.query.ts :
 * - keys.all = invalidation racine (utilisée après mark-as-read)
 * - keys.list / unread / unreadCount / detail = scoped pour caching
 */

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unread-count', userId] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
};

/** Toutes les notifs d'un user, tri créées-desc. Stale 30s. */
export const useNotificationsListQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: notificationKeys.list(userId ?? ''),
    queryFn: () => fetchAllNotifications(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

/** Liste des non-lues uniquement. Stale 15s (plus court car affiche le badge live). */
export const useUnreadNotificationsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: notificationKeys.unread(userId ?? ''),
    queryFn: () => fetchUnreadNotifications(userId!),
    enabled: !!userId,
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000, // refresh passif chaque minute (fallback socket)
  });
};

/** Compteur léger des non-lues — pour le badge cloche. Très court stale. */
export const useUnreadCountQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId ?? ''),
    queryFn: () => fetchUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/** Détail d'une notif. Stale long car immuable côté contenu. */
export const useNotificationDetailQuery = (notificationId: string | undefined) => {
  return useQuery({
    queryKey: notificationKeys.detail(notificationId ?? ''),
    queryFn: () => fetchNotificationDetail(notificationId!),
    enabled: !!notificationId,
    staleTime: 5 * 60 * 1000,
  });
};

/** Marque UNE notif comme lue + invalide les listes/compteur. */
export const useMarkAsReadMutation = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) =>
      markAsRead({ utilisateurId: userId!, notificationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Marque TOUTES les notifs comme lues (V44 endpoint).
 * Remplace le map(async) qui faisait N appels.
 */
export const useMarkAllAsReadMutation = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/** Hook helper : invalide tout le namespace notifications. Utilisé par le socket listener. */
export const useInvalidateNotifications = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
};
