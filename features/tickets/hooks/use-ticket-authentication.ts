import { useState, useCallback } from 'react';
import { useAuthentifierTicket } from '@/features/tickets/queries/tickets.mutation';

export function useTicketAuthentication() {
  const [authenticatedIds, setAuthenticatedIds] = useState<Set<string>>(new Set());
  const { mutate } = useAuthentifierTicket();

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

  return { authenticatedIds, handleAuthentifier };
}
