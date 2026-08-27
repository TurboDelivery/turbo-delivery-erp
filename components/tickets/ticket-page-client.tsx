'use client';

import React, { useMemo } from 'react';
import { Restaurant } from '@/types/models';
import { TicketTable } from '@/components/tickets/table';
import { TicketInsertBar } from '@/components/tickets/table/ticket-insert-bar';
import { useNewTickets } from '@/features/tickets/hooks/use-new-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import { useCreateBonLivraison } from '@/features/tickets/queries/tickets.mutation';
import { CreneauActifBanner } from '@/features/creneaux/components/creneau-actif-banner';
import EtatErreur from '@/components/commons/EtatErreur';

interface TicketPageClientProps {
  restaurants: Restaurant[];
}

export function TicketPageClient({ restaurants }: TicketPageClientProps) {
  const ability = useAbility();
  const { livreurs, isErrorLivreurs, isFetchingLivreurs, refetchLivreurs } = useLivreurs();
  const { mutate: createBonLivraisonMutation, isPending: isCreatingBonLivraison } = useCreateBonLivraison();

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

  // Chaque cellule livreur du tableau, la carte mobile et la barre d'insertion resolvent
  // leur libelle dans livreurOptions. Sur un echec de lecture cette liste reste vide : les
  // tickets s'affichaient sans livreur et le selecteur annoncait "aucun livreur", soit une
  // affectation manquante credible alors que les livreurs existent bel et bien.
  if (isErrorLivreurs) {
    return (
      <>
        <CreneauActifBanner />
        <EtatErreur quoi="les livreurs" onReessayer={() => refetchLivreurs()} enCours={isFetchingLivreurs} />
      </>
    );
  }

  return (
    <>
      <CreneauActifBanner />
      <TicketInsertBar
        livreurOptions={livreurOptions}
        restaurantOptions={restaurantOptions}
        insertState={insertState}
        onInsert={handleInsert}
        canCreate={ability.can('create', 'Ticket')}
      />
      <TicketTable
        restaurants={restaurants}
        livreurOptions={livreurOptions}
        restaurantOptions={restaurantOptions}
        newTickets={newTickets}
        newTicketIds={newTicketIds}
        isCreatingBonLivraison={isCreatingBonLivraison}
        onSaveNewTicket={handleSaveNewTicket}
        onCancelNewTicket={handleCancelNewTicket}
        onNewTicketChange={handleNewTicketChange}
        onNewTicketPatch={handleNewTicketPatch}
      />
    </>
  );
}
