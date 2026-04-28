'use client';

import React from 'react';
import { useRestaurantStats } from '@/features/restaurants/hooks/use-restaurant-stats';

function StatCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col gap-2 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-100 rounded w-1/3" />
    </div>
  );
}

export function RestaurantStatsSection() {
  const { stats, isLoading } = useRestaurantStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const cycleRows = [
    { label: 'Quotidien', value: stats.parCycleQuotidien },
    { label: 'Hebdomadaire', value: stats.parCycleHebdomadaire },
    { label: 'Bi-hebdomadaire', value: stats.parCycleBiHebdomadaire },
    { label: 'Mensuel', value: stats.parCycleMensuel },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total partenaires */}
      <StatCard title="Total partenaires">
        <p className="text-3xl font-bold text-gray-900">{stats.totalPartenaires}</p>
        <p className="text-xs text-gray-400">Partenaires enregistrés</p>
      </StatCard>

      {/* Répartition par type de commission */}
      <StatCard title="Répartition par type de commission">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Commission %</span>
            <span className="text-sm font-semibold text-gray-900">{stats.commissionPourcentage}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Commission fixe</span>
            <span className="text-sm font-semibold text-gray-900">{stats.commissionFixe}</span>
          </div>
        </div>
      </StatCard>

      {/* Répartition par cycle de paiement */}
      <StatCard title="Répartition par cycle de paiement">
        <div className="flex flex-col gap-1.5">
          {cycleRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className="text-sm font-semibold text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>
      </StatCard>
    </div>
  );
}
