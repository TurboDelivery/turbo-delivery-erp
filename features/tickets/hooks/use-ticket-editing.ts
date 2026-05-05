// features/tickets/hooks/use-ticket-editing.ts
import { useState, useCallback, useMemo } from 'react';
import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';

interface UseTicketEditingParams {
  restaurants: Restaurant[];
  ticketsData: Ticket[];
  updateBonLivraisonMutation: (
    vars: { ticketId: string; ticket: Ticket; restaurant?: { typeCommission: string; commission: number } },
    callbacks?: { onSuccess?: () => void },
  ) => void;
}

export function useTicketEditing({ restaurants, ticketsData, updateBonLivraisonMutation }: UseTicketEditingParams) {
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [editedTickets, setEditedTickets] = useState<Map<string, Ticket>>(new Map());

  const handleEditRow = useCallback((id: string) => {
    setEditingIds((prev) => new Set([...prev, id]));
  }, []);

  const handleCancelEditRow = useCallback((id: string) => {
    setEditingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setEditedTickets((prev) => {
      if (!prev.has(id)) return prev;
      const m = new Map(prev);
      m.delete(id);
      return m;
    });
  }, []);

  const handleTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      const base = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (!base) return;
      setEditedTickets((prev) =>
        new Map(prev).set(id, applyTicketPatch(base, { [field]: value }, restaurants)),
      );
    },
    [editedTickets, ticketsData, restaurants],
  );

  const handleTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      setEditedTickets((prev) => {
        const base = prev.get(id) ?? ticketsData.find((t) => t.id === id);
        if (!base) return prev;
        return new Map(prev).set(id, applyTicketPatch(base, patch, restaurants));
      });
    },
    [ticketsData, restaurants],
  );

  const handleSaveRow = useCallback(
    (id: string) => {
      const ticket = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (!ticket) return;
      updateBonLivraisonMutation(
        { ticketId: id, ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        {
          onSuccess: () => {
            handleCancelEditRow(id);
          },
        },
      );
    },
    [editedTickets, ticketsData, restaurants, updateBonLivraisonMutation, handleCancelEditRow],
  );

  const getDisplayTicket = useCallback(
    (ticket: Ticket): Ticket => {
      if (!editingIds.has(ticket.id)) return ticket;
      return editedTickets.get(ticket.id) ?? ticket;
    },
    [editingIds, editedTickets],
  );

  return useMemo(() => ({
    editingIds,
    editedTickets,
    setEditedTickets,
    handleEditRow,
    handleCancelEditRow,
    handleTicketChange,
    handleTicketPatch,
    handleSaveRow,
    getDisplayTicket,
  }), [editingIds, editedTickets, handleEditRow, handleCancelEditRow, handleTicketChange, handleTicketPatch, handleSaveRow, getDisplayTicket]);
}
