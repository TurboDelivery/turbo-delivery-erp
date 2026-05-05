'use client';

import { useMemo, useState } from 'react';
import { ITicketV2, ITicketsV2Params } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { useTicketsV2ListQuery } from '@/features/validation-tickets/verrouillage-v2/queries/tickets-v2-list.query';
import { useVerrouillerTicketV2Mutation, useVerrouillerTousMutation } from '@/features/validation-tickets/verrouillage-v2/queries/tickets-v2.mutation';
import { fakeReadyTickets } from '@/features/validation-tickets/verrouillage-v2/data/fake-tickets';

export default function useVerrouillageV2() {
  const [params] = useState<ITicketsV2Params>({});

  const { data, isLoading, isError } = useTicketsV2ListQuery(params);

  // TODO: retirer le fallback fakeReadyTickets quand l'endpoint est disponible
  const readyTickets: ITicketV2[] = useMemo(() => {
    if (data?.content && data.content.length > 0) return data.content;
    return fakeReadyTickets as ITicketV2[];
  }, [data]);

  const { mutate: verrouillerTicket, isPending: isLocking } = useVerrouillerTicketV2Mutation();
  const { mutate: verrouillerTous, isPending: isLockingAll } = useVerrouillerTousMutation();

  const handleLock = (id: string) => verrouillerTicket(id);
  const handleLockAll = () => verrouillerTous();

  return {
    readyTickets,
    isLoading,
    isError,
    isLocking,
    isLockingAll,
    handleLock,
    handleLockAll,
  };
}
