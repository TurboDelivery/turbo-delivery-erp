'use client';
import React from 'react';
import { useTicketsStats } from '@/features/tickets/hooks/use-tickets-stats';
import { formatCfa, formatNombre } from '@/utils/format.utils';
import { TicketStatsCard } from '@/components/tickets/ticket-stats-card';
import TicketStatsSkeleton from '@/components/tickets/ticket-stats-skeleton';   

function StatsSection() {
  const { ticketsStats, isError, isLoading } = useTicketsStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-4">
      {!isLoading && !isError && (
        <>
          <TicketStatsCard title="Frais de livraison Totaux" value={formatCfa(ticketsStats.totalRevenus)} variant="primary" />
          <TicketStatsCard title="Total des commissions" value={formatCfa(ticketsStats.totalCommissions)} />
          <TicketStatsCard title="Total Tickets" value={formatNombre(ticketsStats.totalTickets)} />
          <TicketStatsCard title="Livreurs" value={formatNombre(ticketsStats.totalLivreurs)} />
          <TicketStatsCard title="Partenaires" value={formatNombre(ticketsStats.totalPartenaires)} />
        </>
      )}
      {isLoading && Array.from({ length: 5 }).map((_, index) => <TicketStatsSkeleton key={index} />)}
      {isError && <div className="col-span-4 text-center text-red-500">Erreur lors du chargement des statistiques.</div>}
    </div>
  );
}

export default StatsSection;
