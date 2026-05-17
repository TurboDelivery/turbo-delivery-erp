'use client';

import { useEffect, useRef } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { TicketControleV2 } from '../types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface Props {
  tickets: TicketControleV2[];
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export default function TicketLockedList({ tickets, total, hasNextPage, isFetchingNextPage, fetchNextPage }: Props) {
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
          <span className="h-2.5 w-2.5 rounded-full bg-gray-900 inline-block" />
          <h2 className="text-base font-semibold text-gray-800">Validés V1</h2>
        </div>
        <span className="text-sm text-gray-400 font-medium">{total}</span>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <p className="text-sm text-gray-400">Aucun ticket validé V1 pour cette période.</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 pr-1">
          {tickets.map((ticket) => (
            <div
              key={ticket.commandeId}
              className="flex flex-col gap-1.5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-gray-900 truncate">{ticket.reference}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wide truncate">{ticket.restaurant}</span>
                </div>
                <Lock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-gray-400">CMD</span>
                <span className="font-semibold text-gray-700">{formatCFA(ticket.coutCommande)}</span>
                <span className="text-gray-200">·</span>
                <span className="text-gray-400">LIV</span>
                <span className="font-semibold text-gray-700">{formatCFA(ticket.coutLivraison)}</span>
                <span className="text-gray-200">·</span>
                <span className="text-gray-400">COM</span>
                <span className="font-semibold text-green-600">
                  {ticket.commission != null ? formatCFA(ticket.commission) : '—'}
                </span>
              </div>
              {ticket.createdByUser && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Créé par</span>
                  <span className="font-medium text-gray-500">
                    {ticket.createdByUser.prenoms} {ticket.createdByUser.nom}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} className="flex items-center justify-center py-1 shrink-0">
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
          </div>
        </div>
      )}
    </div>
  );
}
