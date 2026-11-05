import { useState, useCallback } from 'react';
import { useAuthentifierTicket } from '@/features/tickets/queries/tickets.mutation';

export function useTicketAuthentication() {
  const [authenticatedIds, setAuthenticatedIds] = useState<Set<string>>(new Set());
  const { mutate, mutateAsync } = useAuthentifierTicket();

  const handleAuthentifier = useCallback(
    (id: string) => {
      setAuthenticatedIds((prev) => new Set(prev).add(id));
      mutate(id, {
        onError: () => {
          setAuthenticatedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      });
    },
    [mutate],
  );

  /**
   * UN ticket d'un lot. Rend vrai si l'etape est franchie, faux si elle a echoue.
   *
   * <p>Ne notifie rien et ne rafraichit rien : c'est l'appelant qui compte et qui
   * rend un seul message a la fin. Marquer l'identifiant tout de suite garde la
   * coche optimiste de la ligne, comme pour l'action unitaire.</p>
   */
  const authentifierEnLot = useCallback(
    async (id: string): Promise<boolean> => {
      setAuthenticatedIds((prev) => new Set(prev).add(id));
      try {
        await mutateAsync({ ticketId: id, enLot: true });
        return true;
      } catch {
        setAuthenticatedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return false;
      }
    },
    [mutateAsync],
  );

  return { authenticatedIds, handleAuthentifier, authentifierEnLot };
}
