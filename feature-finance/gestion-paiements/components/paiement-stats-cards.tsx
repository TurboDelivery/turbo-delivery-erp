'use client';

import { Card, CardBody } from '@heroui/react';
import { IPaiementStats } from '../types/paiement.type';

interface PaiementStatsCardsProps {
  stats: IPaiementStats;
  isLoading?: boolean;
}

export default function PaiementStatsCards({ stats, isLoading }: PaiementStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border shadow-none animate-pulse">
            <CardBody className="p-5">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-32" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'TOTAL GLOBAL',
      value: `${stats.totalGlobal.toLocaleString('fr-FR')} FCFA`,
      valueColor: 'text-orange-500',
    },
    {
      label: 'À DÉCAISSER',
      value: `${stats.aDecaisser.toLocaleString('fr-FR')} FCFA`,
      valueColor: 'text-yellow-500',
    },
    {
      label: 'DÉCAISSÉ',
      value: `${stats.decaisse.toLocaleString('fr-FR')} FCFA`,
      valueColor: 'text-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border shadow-none">
          <CardBody className="p-5">
            <p className="text-[11px] font-semibold uppercase text-gray-500 mb-2">{card.label}</p>
            <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
