import React from 'react';
import LivreurStatItem from './livreur-stat-item';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

type LivreurStatsProps = {
  totalTickets: number;
  totalLivraison: number;
  isLoading?: boolean;
  isError?: boolean;
};

function LivreurStats({ totalTickets, totalLivraison, isLoading, isError }: LivreurStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {!isLoading && !isError && (
        <>
          <LivreurStatItem label="Total Tickets" value={totalTickets} />
          <LivreurStatItem label="total livraison" value={formatCFA(totalLivraison)} valueColor="text-orange-500" labelColor="text-orange-500" />
          <LivreurStatItem label="commission" value={formatCFA((totalLivraison || 0) * 0.6)} valueColor="text-blue-500" labelColor="text-blue-500" />
        </>
      )}
      {isLoading && Array.from({ length: 3 }).map((_, index) => <LivreurStatItemSkeleton key={index} />)}
      {isError && <div className="col-span-3 text-center text-red-500">Erreur lors du chargement des statistiques.</div>}
    </div>
  );
}

function LivreurStatItemSkeleton() {
  return (
    <div className="bg-white p-4 rounded">
      <p className="animate-pulse bg-gray-300 h-4 w-24 rounded"></p>
      <p className="animate-pulse bg-gray-300 h-8 w-16 sm:w-24 rounded mt-2"></p>
    </div>
  );
}

export default LivreurStats;
