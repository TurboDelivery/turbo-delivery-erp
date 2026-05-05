'use client';

import { useMemo, useState } from 'react';
import { IRegularisationTicket, IRegularisationParams } from '@/features/validation-tickets/regularisation/types/regularisation.type';
import { useRegularisationListQuery } from '@/features/validation-tickets/regularisation/queries/regularisation-list.query';
import { useApprouverRegularisationMutation, useRejeterRegularisationMutation } from '@/features/validation-tickets/regularisation/queries/regularisation.mutation';
import { fakeRegularisationTickets } from '@/features/validation-tickets/regularisation/data/fake-regularisation-tickets';

export default function useRegularisation() {
  const [params] = useState<IRegularisationParams>({});
  const [selectedId, setSelectedId] = useState<string | null>(
    fakeRegularisationTickets[0]?.id ?? null,
  );

  const { data, isLoading, isError } = useRegularisationListQuery(params);

  // TODO: retirer le fallback fakeRegularisationTickets quand l'endpoint est disponible
  const tickets: IRegularisationTicket[] = useMemo(() => {
    if (data?.content && data.content.length > 0) return data.content;
    return fakeRegularisationTickets as IRegularisationTicket[];
  }, [data]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  const { mutate: approuver, isPending: isApproving } = useApprouverRegularisationMutation();
  const { mutate: rejeter, isPending: isRejecting } = useRejeterRegularisationMutation();

  const handleApprove = (id: string) => {
    approuver(id, {
      onSuccess: () => {
        const remaining = tickets.filter((t) => t.id !== id);
        setSelectedId(remaining[0]?.id ?? null);
      },
    });
  };

  const handleReject = (id: string) => {
    rejeter(id, {
      onSuccess: () => {
        const remaining = tickets.filter((t) => t.id !== id);
        setSelectedId(remaining[0]?.id ?? null);
      },
    });
  };

  return {
    tickets,
    selectedId,
    selectedTicket,
    isLoading,
    isError,
    isApproving,
    isRejecting,
    setSelectedId,
    handleApprove,
    handleReject,
  };
}
