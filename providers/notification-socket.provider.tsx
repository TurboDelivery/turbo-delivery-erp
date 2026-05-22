'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { socket } from '@/socket';
import { useInvalidateNotifications } from '@/features/notifications';
import type { NotificationVm } from '@/features/notifications';

/**
 * Provider qui écoute le channel SocketIO /notification/erp/{userId} et :
 * 1) déclenche un toast sonner pour la notif live (Lot 4 V44)
 * 2) invalide les queries TanStack notifications pour refresh du badge cloche
 *    et de la page /notification sans refetch manuel
 *
 * À monter UNE FOIS dans app/(protected)/layout.tsx (ou un layout au-dessus
 * du dashboard) — le hook s'auto-démonte aux changements de userId
 * (logout/login) pour éviter les fuites d'écoute.
 *
 * Note V44 : la socket actuelle (singleton dans socket.ts) n'envoie PAS
 * d'auth JWT au handshake. Le backend permet l'abonnement libre — un user
 * malveillant pourrait s'abonner au channel d'un autre. À durcir quand le
 * backend supportera auth socket : passer {@code auth: {token: session.user.token}}
 * à io() côté socket.ts + valider côté serveur.
 */
export function NotificationSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const utilisateurId = session?.user?.id;
  const invalidate = useInvalidateNotifications();

  useEffect(() => {
    if (!utilisateurId) return;

    const channel = `/notification/erp/${utilisateurId}`;

    const onNotification = (raw: unknown) => {
      try {
        // Le backend envoie un JSON.stringify(NotificationTable) — donc une string.
        // Mais on guard pour le cas où un autre service enverrait un objet déjà parsé.
        const data: NotificationVm =
          typeof raw === 'string' ? JSON.parse(raw) : (raw as NotificationVm);

        if (!data || (!data.titre && !data.message)) return;

        // Push toast immédiat (niveau 1 — temps réel)
        toast.info(data.titre || 'Nouvelle notification', {
          description: data.message,
          duration: 6000,
        });

        // Invalidate les queries notifications → badge cloche + page se refresh auto
        invalidate();
      } catch (e) {
        console.error('[NotifSocket] parse error', e);
      }
    };

    socket.on(channel, onNotification);
    return () => {
      socket.off(channel, onNotification);
    };
  }, [utilisateurId, invalidate]);

  return <>{children}</>;
}
