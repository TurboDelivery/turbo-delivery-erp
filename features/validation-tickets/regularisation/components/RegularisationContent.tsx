'use client';

import { useState } from 'react';
import RegularisationPageHeader from './RegularisationPageHeader';
import RegularisationQueue from './RegularisationQueue';
import RegularisationDetail from './RegularisationDetail';
import { fakeRegularisationTickets, type RegularisationTicket } from '../data/fake-regularisation-tickets';

export default function RegularisationContent() {
  const [tickets, setTickets] = useState<RegularisationTicket[]>(fakeRegularisationTickets);
  const [selectedId, setSelectedId] = useState<string | null>(fakeRegularisationTickets[0]?.id ?? null);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  const removeTicket = (id: string) => {
    setTickets((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <RegularisationPageHeader pendingCount={tickets.length} />

      <div className="flex gap-5 items-start">
        <RegularisationQueue
          tickets={tickets}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedTicket ? (
          <RegularisationDetail
            ticket={selectedTicket}
            onApprove={removeTicket}
            onReject={removeTicket}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-xl border border-gray-200 bg-white py-24">
            <p className="text-sm text-gray-400">Sélectionnez un ticket pour voir les détails.</p>
          </div>
        )}
      </div>
    </div>
  );
}
