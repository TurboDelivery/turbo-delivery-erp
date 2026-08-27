'use client';

import { useCallback, useMemo, useState } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { StatutControle } from '@/types/statut-controle.enum';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { useRegularisationTicketsQuery } from '@/features/validation-tickets/regularisation/queries/regularisation-tickets.query';
import {
  useApprouverRegularisationMutation,
  useRejeterRegularisationMutation,
} from '@/features/validation-tickets/regularisation/queries/regularisation.mutation';
import { useTicketAuthentication } from '@/features/tickets/hooks/use-ticket-authentication';
import {
  createRegularisationTicketsColumns,
  RegularisationTicketsColumnMeta,
} from '@/features/validation-tickets/regularisation/components/regularisation-tickets-columns';

const PAGE_SIZE = 10;

/**
 * État + instance de table pour le tableau « Tickets par statut & créneau ».
 * Filtres en useState local (pas de nuqs) pour éviter toute collision d'URL
 * avec la TicketFilterBar déjà présente en haut de la page.
 */
export default function useRegularisationTicketsTable() {
  const [statut, setStatutState] = useState<StatutControle>(StatutControle.PENDING);
  const [creneauId, setCreneauIdState] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);

  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = useMemo(() => creneauList?.content ?? [], [creneauList]);

  const selectedCreneau = useMemo(
    () => creneaux.find((c) => c.id === creneauId),
    [creneaux, creneauId],
  );

  // Les dates du créneau sont des ISO complets ; l'API attend YYYY-MM-DD.
  const debut = selectedCreneau?.dateDebut?.split('T')[0];
  const fin = selectedCreneau?.dateFin?.split('T')[0];

  const { data, isLoading, isFetching } = useRegularisationTicketsQuery({
    statut,
    debut,
    fin,
    page,
    size: PAGE_SIZE,
  });

  const tickets = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  // Tout changement de filtre repart à la première page.
  const setStatut = useCallback((value: StatutControle) => {
    setStatutState(value);
    setPage(0);
  }, []);

  const setCreneauId = useCallback((id: string | undefined) => {
    setCreneauIdState(id);
    setPage(0);
  }, []);

  const { mutate: approuver, isPending: isApproving } = useApprouverRegularisationMutation();
  const { mutate: rejeter, isPending: isRejecting } = useRejeterRegularisationMutation();
  const { authenticatedIds, handleAuthentifier } = useTicketAuthentication();

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [ticketToReject, setTicketToReject] = useState<BonLivraisonTerminee | null>(null);
  const [motif, setMotif] = useState('');

  const handleApprove = useCallback(
    (id: string) => {
      setApprovingId(id);
      approuver(id, { onSettled: () => setApprovingId(null) });
    },
    [approuver],
  );

  const openReject = useCallback((ticket: BonLivraisonTerminee) => {
    setTicketToReject(ticket);
    setMotif('');
  }, []);

  const closeReject = useCallback(() => {
    setTicketToReject(null);
    setMotif('');
  }, []);

  const confirmReject = useCallback(() => {
    if (!ticketToReject) return;
    rejeter(
      { id: ticketToReject.commandeId, motif: motif.trim() },
      {
        onSuccess: () => {
          setTicketToReject(null);
          setMotif('');
        },
      },
    );
  }, [ticketToReject, motif, rejeter]);

  const columns = useMemo(() => createRegularisationTicketsColumns(), []);

  const meta: RegularisationTicketsColumnMeta = useMemo(
    () => ({
      onApprove: handleApprove,
      onReject: openReject,
      onAuthentifier: handleAuthentifier,
      approvingId,
      isApproving,
      authenticatedIds,
    }),
    [handleApprove, openReject, handleAuthentifier, approvingId, isApproving, authenticatedIds],
  );

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
    getRowId: (row) => row.commandeId,
  });

  return {
    table,
    isLoading,
    isFetching,
    columnsCount: columns.length,
    // filtres
    statut,
    setStatut,
    creneaux,
    creneauId,
    setCreneauId,
    isLoadingCreneaux,
    // pagination
    page,
    setPage,
    totalPages,
    // modale de rejet
    ticketToReject,
    motif,
    setMotif,
    closeReject,
    confirmReject,
    isRejecting,
  };
}
