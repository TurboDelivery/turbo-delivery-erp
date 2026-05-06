'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTicketsV1ValideQuery } from '../queries/tickets-v2-list.query';
import { useValiderV2Mutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';

export function useVerrouillageV2Content() {
  const { data, isLoading } = useTicketsV1ValideQuery();
  const { data: creneauActif } = useCreneauActifQuery();
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const { mutate: validerV2, isPending: isValidating } = useValiderV2Mutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();

  const tickets = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );

  const handleValidate = useCallback(
    (id: string) => {
      setValidatingId(id);
      validerV2(id, { onSettled: () => setValidatingId(null) });
    },
    [validerV2],
  );

  const handleReject = useCallback(
    (id: string, motif: string) => {
      rejeterFraude({ id, motif }, { onSuccess: () => setRejectDialogId(null) });
    },
    [rejeterFraude],
  );

  const handleValidateAll = useCallback(() => {
    tickets.forEach((t) => validerV2(t.commandeId));
  }, [tickets, validerV2]);

  return {
    tickets,
    isLoading,
    validatingId,
    isValidating,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    creneauActif,
    handleValidate,
    handleReject,
    handleValidateAll,
  };
}
