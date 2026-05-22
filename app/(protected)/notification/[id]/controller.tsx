'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMarkAsReadMutation } from '@/features/notifications';

/**
 * Auto-mark-as-read au mount du détail. V44 : utilise la mutation TanStack
 * (qui invalide les queries listes + compteur automatiquement) au lieu du
 * router.refresh() legacy qui forçait un refetch de toute la page.
 */
export function useDetailNotificationController(id: string) {
  const { data } = useSession();
  const userId = data?.user?.id;
  const markMut = useMarkAsReadMutation(userId);

  useEffect(() => {
    if (!id || !userId) return;
    markMut.mutate({ notificationId: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);
}
