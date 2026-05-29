'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import TicketReadyCard from './TicketReadyCard';
import { TicketControleV2 } from '../types/tickets-v2.type';

interface Props {
  tickets: TicketControleV2[];
  total: number;
  onLock: (ticketId: string) => void;
  onReject: (ticketId: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export default function TicketReadyList({ tickets, total, onLock, onReject, hasNextPage, isFetchingNextPage, fetchNextPage }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage(); },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 max-h-[70vh]">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
          <h2 className="text-base font-semibold text-gray-800">Prêts pour V1</h2>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
          {total}
        </span>
      </div>

      <div ref={scrollRef} className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
        {tickets.map((ticket) => (
          <TicketReadyCard key={ticket.commandeId} ticket={ticket} onLock={onLock} onReject={onReject} />
        ))}
        <div ref={bottomRef} className="flex items-center justify-center py-1 shrink-0">
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
        </div>
      </div>
    </div>
  );
}
