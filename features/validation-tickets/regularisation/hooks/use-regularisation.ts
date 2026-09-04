'use client';

import { useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { useRegularisationListQuery } from '@/features/validation-tickets/regularisation/queries/regularisation-list.query';
import { useApprouverRegularisationMutation, useRejeterRegularisationMutation } from '@/features/validation-tickets/regularisation/queries/regularisation.mutation';
import { applyTicketFilters } from '@/components/validation-tickets/TicketFilterBar';
import { validationTicketFiltersConfig, validationTicketFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';
import { useTicketFilterOptions } from '@/features/validation-tickets/hooks/use-ticket-filter-options';

export default function useRegularisation() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);

  const { data, isLoading, isError, isFetching, refetch } = useRegularisationListQuery();
  const { livreurOptions, restaurantOptions } = useTicketFilterOptions();

  const tickets: BonLivraisonTerminee[] = useMemo(() => data?.content ?? [], [data]);

  // Le compteur suit le TOTAL renvoye par le service, pas la taille de la page
  // recue : `content.length` plafonnait a la taille de page et faisait passer une
  // file de 200 tickets pour une file de 50.
  const totalEnAttente = data?.totalElements ?? tickets.length;
  const listeTronquee = (data?.totalElements ?? 0) > tickets.length;

  const filteredTickets = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters]);

  const selectedTicket = tickets.find((t) => t.commandeId === selectedId) ?? null;

  const { mutate: approuver, isPending: isApproving } = useApprouverRegularisationMutation();
  const { mutate: rejeter, isPending: isRejecting } = useRejeterRegularisationMutation();

  const handleApprove = (id: string) => {
    approuver(id, {
      onSuccess: () => {
        const remaining = tickets.filter((t) => t.commandeId !== id);
        setSelectedId(remaining[0]?.commandeId ?? null);
      },
    });
  };

  const handleReject = (id: string, motif: string) => {
    rejeter({ id, motif }, {
      onSuccess: () => {
        const remaining = tickets.filter((t) => t.commandeId !== id);
        setSelectedId(remaining[0]?.commandeId ?? null);
      },
    });
  };

  return {
    tickets,
    totalEnAttente,
    listeTronquee,
    filteredTickets,
    filters,
    setFilters,
    livreurOptions,
    restaurantOptions,
    selectedId,
    selectedTicket,
    isLoading,
    isError,
    // isError etait deja expose mais personne ne le lisait : il manquait de quoi
    // relancer, donc l'ecran restait sur « Aucun ticket en attente ».
    isFetching,
    refetch,
    isApproving,
    isRejecting,
    setSelectedId,
    handleApprove,
    handleReject,
  };
}
