'use client';

import { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryStates } from 'nuqs';
import { IVerrouillageParams } from '../types/tickets-v2.type';
import { useTicketsAuthentifiesQuery, useTicketsV1ValideQuery } from '../queries/tickets-v2-list.query';
import { useValiderV1Mutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useInvalidateTicketsV2Query } from '../queries/index.query';
import { sansDoublons } from '../utils/sans-doublons';
import { validationTicketFiltersConfig, validationTicketFiltersOptions } from '@/features/validation-tickets/filters/validation-tickets.filters';
import { useTicketFilterOptions } from '@/features/validation-tickets/hooks/use-ticket-filter-options';

export default function useVerrouillageV2() {
  const [isLockingAll, setIsLockingAll] = useState(false);
  // Tickets dont la validation est en vol. Un second clic pendant ce temps partait quand même
  // et revenait en 409 : l'opérateur voyait une erreur rouge sur une action qui avait réussi.
  const enVol = useRef(new Set<string>());
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [filters, setFiltersRaw] = useQueryStates(validationTicketFiltersConfig, validationTicketFiltersOptions);

  const setFilters = (v: typeof filters) => void setFiltersRaw(v);

  const params = useMemo<IVerrouillageParams>(() => ({
    debut: filters.debut || undefined,
    fin: filters.fin || undefined,
    restaurantId: filters.restaurantId || undefined,
    livreurId: filters.livreurId || undefined,
    search: filters.search || undefined,
    numero: filters.numero || undefined,
  }), [filters.debut, filters.fin, filters.restaurantId, filters.livreurId, filters.search, filters.numero]);

  const { data: readyData, isLoading: isLoadingReady, fetchNextPage: fetchNextReady, hasNextPage: hasNextReady, isFetchingNextPage: isFetchingNextReady } = useTicketsAuthentifiesQuery(params);
  const { data: lockedData, isLoading: isLoadingLocked, fetchNextPage: fetchNextLocked, hasNextPage: hasNextLocked, isFetchingNextPage: isFetchingNextLocked } = useTicketsV1ValideQuery(params);
  const { livreurOptions } = useTicketFilterOptions();

  // Dédoublonnage indispensable sur une liste paginée dont les éléments SORTENT au fur et à
  // mesure : chaque ticket validé quitte la liste, les pages suivantes se décalent d'un rang,
  // et un ticket déjà chargé en page 1 réapparaît en page 2. Le doublon se voyait à l'écran
  // (deux cartes identiques, clés React en conflit) et surtout se validait deux fois — le
  // second envoi revenant en 409 « déjà validé ».
  const readyTickets = useMemo(() => sansDoublons(readyData?.pages.flatMap((p) => p.content) ?? []), [readyData]);
  const lockedTickets = useMemo(() => sansDoublons(lockedData?.pages.flatMap((p) => p.content) ?? []), [lockedData]);

  const totalReady = readyData?.pages[0]?.totalElements ?? 0;
  const totalLocked = lockedData?.pages[0]?.totalElements ?? 0;

  const { mutate: validerV1, mutateAsync: validerV1Async, isPending: isLocking } = useValiderV1Mutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();
  const invalidate = useInvalidateTicketsV2Query();

  const handleLock = (ticketId: string) => {
    if (enVol.current.has(ticketId)) {
      return;
    }
    enVol.current.add(ticketId);
    validerV1({ ticketId }, { onSettled: () => enVol.current.delete(ticketId) });
  };

  const handleReject = (id: string, motif: string) =>
    rejeterFraude({ id, motif }, { onSuccess: () => setRejectDialogId(null) });

  const handleLockAll = async () => {
    if (readyTickets.length === 0) return;
    setIsLockingAll(true);

    // Un seul compte-rendu à la fin, et un seul rafraîchissement : en mode lot, la mutation
    // se tait et ne recharge pas la liste. Chaque ticket reste tenté indépendamment — un
    // refus isolé ne doit pas interrompre le lot.
    let valides = 0;
    let dejaValides = 0;
    const echecs: string[] = [];

    try {
      for (const ticket of readyTickets) {
        try {
          const issue = await validerV1Async({ ticketId: ticket.commandeId, enLot: true });
          if (issue === 'deja-valide') dejaValides += 1;
          else valides += 1;
        } catch (erreur) {
          echecs.push(erreur instanceof Error ? erreur.message : 'Erreur inconnue');
        }
      }
    } finally {
      setIsLockingAll(false);
      await invalidate();
    }

    if (echecs.length > 0) {
      toast.error(`${echecs.length} ticket(s) non validé(s)`, { description: echecs[0] });
    }
    if (valides > 0 || dejaValides > 0) {
      const detail = dejaValides > 0 ? `${dejaValides} l'étaient déjà.` : undefined;
      toast.success(`${valides} ticket(s) validé(s) V1.`, { description: detail });
    }
  };

  return {
    readyTickets,
    lockedTickets,
    totalReady,
    totalLocked,
    filters,
    setFilters,
    livreurOptions,
    isLoadingReady,
    isLoadingLocked,
    isLocking,
    isLockingAll,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    handleReject,
    fetchNextReady,
    hasNextReady,
    isFetchingNextReady,
    fetchNextLocked,
    hasNextLocked,
    isFetchingNextLocked,
    handleLock,
    handleLockAll,
  };
}
