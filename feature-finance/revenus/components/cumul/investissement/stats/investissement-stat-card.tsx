import React from 'react';
import { Card } from '@/components/ui/card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

type Props = {
  stat: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  };
  isLoading?: boolean;
};

function InvestissementStatCard({ stat, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center">
        <div className="flex justify-between items-start w-full gap-2">
          <div className="flex flex-col items-start gap-8 w-full">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div className="flex flex-col items-start">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 flex flex-col items-center justify-center`}>
      <div className="flex justify-between items-start w-full gap-2">
        <div className="flex flex-col items-start gap-8">
          <h3 className="text-md capitalize">{stat.title}</h3>
          <div className="flex flex-col items-start">
            <p className={`text-xl font-bold ${stat.color} font-exo`}>{formatCFA(stat.value)}</p>
          </div>
        </div>
        <div>
          <p className={`text-xs text-gray-400 font-exo flex items-center ${stat.bgColor} ${stat.color} p-2 rounded-full`}>{stat.icon}</p>
        </div>
      </div>
    </Card>
  );
}

export default InvestissementStatCard;
