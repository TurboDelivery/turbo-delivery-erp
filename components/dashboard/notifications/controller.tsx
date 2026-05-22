import { useSession } from 'next-auth/react';
import {
  useUnreadNotificationsQuery,
  useNotificationsListQuery,
  useMarkAllAsReadMutation,
} from '@/features/notifications';

/**
 * Controller refactoré V44 — utilise TanStack Query au lieu du state local
 * + useEffect chaîne fragile. Préserve l'API publique pour que le content.tsx
 * legacy continue de fonctionner sans modification.
 *
 * Bénéfices :
 * - Cache automatique + invalidation propre (plus de race condition)
 * - mark-all-as-read appelle l'endpoint bulk V44 (1 requête au lieu de N)
 * - Refresh passif chaque 60s en fallback du socket
 *
 * Note : isConnected est désormais géré par le provider socket global
 * (providers/socket.provider.tsx). En attendant, on retourne true par défaut.
 */
export function useNotificationController() {
  const session = useSession();
  const utilisateurId = session.data?.user.id;

  const { data: unread = [] } = useUnreadNotificationsQuery(utilisateurId);
  const { data: all = [] } = useNotificationsListQuery(utilisateurId);

  const markAllMut = useMarkAllAsReadMutation(utilisateurId);

  // Filtre des notifs sans titre ni message (anti-bruit historique)
  const cleanUnread = unread.filter((n) => n.titre || n.message);
  const cleanAll = all.filter((n) => n.titre || n.message);

  const toutMarqueCommeLus = () => {
    if (cleanUnread.length === 0) return;
    markAllMut.mutate();
  };

  return {
    notifications: cleanUnread,
    notificationNonLus: cleanUnread,
    toutNotifications: cleanAll,
    isConnected: true, // TODO V44+: provider socket global gérera l'état réel
    voirMoins: false,
    voirTout: () => {
      // Inutile maintenant — la liste complète est sur /notification.
      // Garde la signature pour rétrocompat content.tsx.
    },
    toutMarqueCommeLus,
  };
}
