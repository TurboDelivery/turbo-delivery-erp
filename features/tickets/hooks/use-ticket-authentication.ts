// features/tickets/hooks/use-ticket-authentication.ts
import { useState, useCallback } from 'react';

export function useTicketAuthentication() {
  const [authenticatedIds, setAuthenticatedIds] = useState<Set<string>>(new Set());

  const handleAuthentifier = useCallback((id: string) => {
    setAuthenticatedIds((prev) => new Set(prev).add(id));
  }, []);

  return { authenticatedIds, handleAuthentifier };
}
