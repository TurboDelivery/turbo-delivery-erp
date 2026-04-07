'use client';

import { Card, CardBody } from '@heroui/react';
import { Crosshair, FileText, Receipt, Target, Wallet } from 'lucide-react';
import { IChargeStats } from '../../types/charge-fixe.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface ChargesStatsV2Props {
  stats?: IChargeStats;
  isLoading?: boolean;
}

export default function ChargesStatsCardsV2({ stats, isLoading }: ChargesStatsV2Props) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-gray-50 border border-gray-200 shadow-none animate-pulse">
            <CardBody className="p-4">
              <div className="h-3 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  const today = new Date();
  const jourDuMois = today.getDate();
  const joursTotal = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const cards = [
    {
      label: 'TOTAL CHARGES FIXES MENSUELLES',
      value: formatCFA(stats.totalMensuel),
      sub: 'Budget cible du mois',
      bg: 'bg-blue-50 border-blue-100',
      textColor: 'text-blue-600',
      icon: <Wallet size={20} className="text-white" />,
      iconBg: 'bg-blue-500',
    },
    {
      label: 'CHARGES FIXES AU PRORATA',
      value: formatCFA(stats.prorata),
      sub: `Jour ${jourDuMois}/${joursTotal} du mois`,
      bg: 'bg-orange-50 border-orange-100',
      textColor: 'text-orange-600',
      icon: <Receipt size={20} className="text-white" />,
      iconBg: 'bg-orange-500',
    },
    {
      label: 'DÉPENSES VARIABLES APPROUVÉES',
      value: formatCFA(stats.totalVariablesApprouvees),
      sub: `${stats.countVariablesApprouvees} dépenses validées`,
      bg: 'bg-green-50 border-green-100',
      textColor: 'text-green-600',
      icon: <FileText size={20} className="text-white" />,
      iconBg: 'bg-green-500',
    },
    {
      label: 'TOTAL CHARGES À DATE',
      value: formatCFA(stats.totalChargesADate),
      sub: 'Prorata fixe + Variables approuvées',
      bg: 'bg-purple-50 border-purple-100',
      textColor: 'text-purple-600',
      icon: <Target size={20} className="text-white" />,
      iconBg: 'bg-purple-500',
    },
    {
      label: 'POINT MORT DU JOUR',
      value: `${stats.pointMortCourses} courses`,
      sub: `${formatCFA(stats.pointMortMontant)} à couvrir aujourd'hui`,
      bg: 'bg-red-500 border-red-500',
      textColor: 'text-white',
      valueColor: 'text-white',
      subColor: 'text-red-200',
      icon: <Crosshair size={20} className="text-white" />,
      iconBg: 'bg-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`${card.bg} border shadow-none`}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-semibold uppercase leading-tight ${card.textColor}`}>
                {card.label}
              </span>
              <div className={`${card.iconBg} p-1.5 rounded-lg shrink-0`}>{card.icon}</div>
            </div>
            <p className={`text-xl font-bold ${card.valueColor ?? 'text-gray-900'}`}>{card.value}</p>
            <p className={`text-xs mt-1 ${card.subColor ?? 'text-gray-500'}`}>{card.sub}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
