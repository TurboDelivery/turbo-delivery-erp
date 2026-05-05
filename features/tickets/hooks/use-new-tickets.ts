// features/tickets/hooks/use-new-tickets.ts
import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';

interface Option { value: string; label: string }

interface UseNewTicketsParams {
  restaurants: Restaurant[];
  livreurOptions: Option[];
  restaurantOptions: Option[];
  createBonLivraisonMutation: (
    vars: { ticket: Ticket; restaurant?: { typeCommission: string; commission: number } },
    callbacks?: { onSuccess?: () => void },
  ) => void;
}

export function useNewTickets({ restaurants, livreurOptions, restaurantOptions, createBonLivraisonMutation }: UseNewTicketsParams) {
  const [newTickets, setNewTickets] = useState<Ticket[]>([]);

  // Insert bar state
  const [insertCount, setInsertCount] = useState<number>(1);
  const [insertLivreurId, setInsertLivreurId] = useState<string>('');
  const [insertRestaurantId, setInsertRestaurantId] = useState<string>('');
  const [insertDate, setInsertDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const newTicketIds = useMemo(() => new Set(newTickets.map((t) => t.id)), [newTickets]);

  const handleInsert = useCallback(() => {
    if (insertCount <= 0) return;
    const livreurLabel = livreurOptions.find((l) => l.value === insertLivreurId)?.label ?? '';
    const restaurantLabel = restaurantOptions.find((r) => r.value === insertRestaurantId)?.label ?? '';

    const tickets: Ticket[] = Array.from({ length: insertCount }).map(() => ({
      id: uuidv4(),
      reference: '',
      livreurId: insertLivreurId,
      livreur: livreurLabel,
      restaurantId: insertRestaurantId,
      restaurant: restaurantLabel,
      montantCommande: '',
      montantLivraison: '',
      coutLivraison: '',
      date: insertDate || new Date().toISOString().split('T')[0],
      heure: new Date().toLocaleTimeString('fr-FR'),
      isNew: true,
      isEditing: true,
      statut: 'TERMINE',
    }));

    setNewTickets((prev) => [...tickets, ...prev]);
  }, [insertCount, insertLivreurId, insertRestaurantId, insertDate, livreurOptions, restaurantOptions]);

  const handleSaveNewTicket = useCallback(
    (id: string) => {
      const ticket = newTickets.find((t) => t.id === id);
      if (!ticket) return;
      createBonLivraisonMutation(
        { ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        { onSuccess: () => setNewTickets((prev) => prev.filter((t) => t.id !== id)) },
      );
    },
    [newTickets, createBonLivraisonMutation, restaurants],
  );

  const handleCancelNewTicket = useCallback((id: string) => {
    setNewTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleNewTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      setNewTickets((prev) =>
        prev.map((t) => (t.id === id ? applyTicketPatch(t, { [field]: value }, restaurants) : t)),
      );
    },
    [restaurants],
  );

  const handleNewTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      setNewTickets((prev) =>
        prev.map((t) => (t.id === id ? applyTicketPatch(t, patch, restaurants) : t)),
      );
    },
    [restaurants],
  );

  return {
    newTickets,
    newTicketIds,
    insertState: { insertCount, insertLivreurId, insertRestaurantId, insertDate, setInsertCount, setInsertLivreurId, setInsertRestaurantId, setInsertDate },
    handleInsert,
    handleSaveNewTicket,
    handleCancelNewTicket,
    handleNewTicketChange,
    handleNewTicketPatch,
  };
}
