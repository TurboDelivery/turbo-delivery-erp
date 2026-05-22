// Barrel — point d'entrée unique pour la feature notifications.
// Toujours importer depuis '@/features/notifications', pas en deep-import.

export type {
  NotificationVm,
  NotificationDetailsVm,
  NotificationType,
  LireNotificationCommande,
  MarkAllAsReadResponse,
  UnreadCountResponse,
} from './types/notification.type';

export {
  fetchAllNotifications,
  fetchUnreadNotifications,
  fetchUnreadCount,
  fetchNotificationDetail,
  markAsRead,
  markAllAsRead,
} from './actions/notifications.actions';

export {
  notificationKeys,
  useNotificationsListQuery,
  useUnreadNotificationsQuery,
  useUnreadCountQuery,
  useNotificationDetailQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useInvalidateNotifications,
} from './queries/notifications.query';
