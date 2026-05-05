'use client';

import React, { useMemo } from 'react';
import { Restaurant } from '@/types/models';
import { TicketTable } from '@/components/tickets/table';
import { TicketInsertBar } from '@/components/tickets/table/ticket-insert-bar';
import { useNewTickets } from '@/features/tickets/hooks/use-new-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import { useCreateBonLivraison } from '@/features/tickets/queries/tickets.mutation';

interface TicketPageClientProps {
  restaurants: Restaurant[];
}

export function TicketPageClient({ restaurants }: TicketPageClientProps) {
  const ability = useAbility();
  const { livreurs } = useLivreurs();
  const { mutate: createBonLivraisonMutation } = useCreateBonLivraison();

  const validLivreurs = useMemo(() => livreurs.filter((l) => l.prenoms && l.nom), [livreurs]);
  const livreurOptions = useMemo(() => validLivreurs.map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const {
    newTickets,
    newTicketIds,
    insertState,
    handleInsert,
    handleSaveNewTicket,
    handleCancelNewTicket,
    handleNewTicketChange,
    handleNewTicketPatch,
  } = useNewTickets({ restaurants, livreurOptions, restaurantOptions, createBonLivraisonMutation });

  return (
    <>
      <TicketInsertBar
        livreurOptions={livreurOptions}
        restaurantOptions={restaurantOptions}
        insertState={insertState}
        onInsert={handleInsert}
        canCreate={ability.can('create', 'Ticket')}
      />
      <TicketTable
        restaurants={restaurants}
        newTickets={newTickets}
        newTicketIds={newTicketIds}
        onSaveNewTicket={handleSaveNewTicket}
        onCancelNewTicket={handleCancelNewTicket}
        onNewTicketChange={handleNewTicketChange}
        onNewTicketPatch={handleNewTicketPatch}
      />
    </>
  );
}
