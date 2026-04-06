'use client';

import { Card, CardBody } from '@heroui/react';
import { Crosshair, FileText, Receipt, Target, Wallet } from 'lucide-react';

interface ChargesStatsV2Props {
  stats: {
    totalChargesFixes: number;
    prorata: number;
    jourDuMois: number;
    joursTotal: number;
    pourcentageMois: number;
    totalVariablesApprouvees: number;
    countVariablesApprouvees: number;
    totalChargesADate: number;
    pointMortCourses: number;
  };
}

const fmt = (v: number) => `${v.toLocaleString('fr-FR')} FCFA`;

export default function ChargesStatsCardsV2({ stats }: ChargesStatsV2Props) {
  const cards = [
    {
      label: 'TOTAL CHARGES FIXES MENSUELLES',
      value: fmt(stats.totalChargesFixes),
      sub: 'Budget cible du mois',
      bg: 'bg-blue-50 border-blue-100',
      textColor: 'text-blue-600',
      icon: <Wallet size={20} className="text-white" />,
      iconBg: 'bg-blue-500',
    },
    {
      label: 'CHARGES FIXES AU PRORATA',
      value: fmt(stats.prorata),
      sub: `Jour ${stats.jourDuMois}/${stats.joursTotal} — ${stats.pourcentageMois}% du mois`,
      bg: 'bg-orange-50 border-orange-100',
      textColor: 'text-orange-600',
      icon: <Receipt size={20} className="text-white" />,
      iconBg: 'bg-orange-500',
    },
    {
      label: 'DÉPENSES VARIABLES APPROUVÉES',
      value: fmt(stats.totalVariablesApprouvees),
      sub: `${stats.countVariablesApprouvees} dépenses validées`,
      bg: 'bg-green-50 border-green-100',
      textColor: 'text-green-600',
      icon: <FileText size={20} className="text-white" />,
      iconBg: 'bg-green-500',
    },
    {
      label: 'TOTAL CHARGES À DATE',
      value: fmt(stats.totalChargesADate),
      sub: 'Prorata fixe + Variables approuvées',
      bg: 'bg-purple-50 border-purple-100',
      textColor: 'text-purple-600',
      icon: <Target size={20} className="text-white" />,
      iconBg: 'bg-purple-500',
    },
    {
      label: 'POINT MORT DU JOUR',
      value: `${stats.pointMortCourses} courses`,
      sub: `${fmt(stats.prorata)} à couvrir aujourd'hui`,
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
