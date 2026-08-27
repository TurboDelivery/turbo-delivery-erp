'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import type {
  NotificationVm,
  NotificationDetailsVm,
  LireNotificationCommande,
  MarkAllAsReadResponse,
  UnreadCountResponse,
} from '@/features/notifications/types/notification.type';

/**
 * Server Actions wrapper pour les 6 endpoints REST /api/erp/notification/*.
 *
 * - Remplace src/actions/notifcation.action.ts (typo) en restant rétrocompat
 *   (mêmes endpoints, même format de retour).
 * - 2 nouveaux endpoints V44 : mark-all-as-read + count-non-lu.
 *
 * Les hooks TanStack (features/notifications/queries) wrappent ces actions
 * pour le caching et l'invalidation côté React.
 */

const BASE = '/api/erp/notification';

export async function fetchAllNotifications(utilisateurId: string): Promise<NotificationVm[]> {
  try {
    const data = await apiClientHttp.request<NotificationVm[]>({
      endpoint: `${BASE}/${utilisateurId}/tous`,
      method: 'GET',
      service: 'backend',
    });
    return data ?? [];
  } catch (error) {
    console.error('[notifications] fetchAll error:', error);
    return [];
  }
}

export async function fetchUnreadNotifications(utilisateurId: string): Promise<NotificationVm[]> {
  try {
    const data = await apiClientHttp.request<NotificationVm[]>({
      endpoint: `${BASE}/${utilisateurId}/non-lu`,
      method: 'GET',
      service: 'backend',
    });
    return data ?? [];
  } catch (error) {
    console.error('[notifications] fetchUnread error:', error);
    return [];
  }
}

export async function fetchNotificationDetail(notificationId: string): Promise<NotificationDetailsVm | null> {
  try {
    return await apiClientHttp.request<NotificationDetailsVm>({
      endpoint: `${BASE}/${notificationId}`,
      method: 'GET',
      service: 'backend',
    });
  } catch (error) {
    console.error('[notifications] fetchDetail error:', error);
    return null;
  }
}

/**
 * Marque UNE notification comme lue.
 * Le body est obligatoire (utilisateurId + notificationId) — le backend vérifie
 * l'ownership pour éviter qu'un user marque les notifs d'un autre.
 */
export async function markAsRead(body: LireNotificationCommande): Promise<boolean> {
  try {
    await apiClientHttp.request<void>({
      endpoint: BASE,
      method: 'PUT',
      data: body,
      service: 'backend',
    });
    return true;
  } catch (error) {
    console.error('[notifications] markAsRead error:', error);
    return false;
  }
}

/**
 * Marque TOUTES les notifs non-lues d'un user comme lues.
 * Endpoint V44 — remplace le pattern N+1 du frontend qui appelait /lire pour
 * chaque notif dans un map(async).
 */
export async function markAllAsRead(utilisateurId: string): Promise<MarkAllAsReadResponse> {
  try {
    return await apiClientHttp.request<MarkAllAsReadResponse>({
      endpoint: `${BASE}/${utilisateurId}/tous-lus`,
      method: 'PUT',
      service: 'backend',
    });
  } catch (error) {
    console.error('[notifications] markAllAsRead error:', error);
    return { updated: 0 };
  }
}

/**
 * Compteur des notifs non-lues — léger, pour le badge cloche.
 * Endpoint V44.
 */
export async function fetchUnreadCount(utilisateurId: string): Promise<number> {
  try {
    const data = await apiClientHttp.request<UnreadCountResponse>({
      endpoint: `${BASE}/${utilisateurId}/count-non-lu`,
      method: 'GET',
      service: 'backend',
    });
    return data?.count ?? 0;
  } catch (error) {
    console.error('[notifications] fetchUnreadCount error:', error);
    return 0;
  }
}
