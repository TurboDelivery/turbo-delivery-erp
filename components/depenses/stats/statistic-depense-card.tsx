import React from 'react';
import { Card } from '@/components/ui/card';

type CardProps = {
  title?: string;
  value?: string | number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  isLoading?: boolean;
};

function StatisticDepenseCard({ title, value, color, bgColor, icon, isLoading = false }: CardProps) {
  if (isLoading) {
    return <StatisticDepenseCardSkeleton />;
  }
  return (
    <Card className={`p-6 flex flex-col items-center justify-center`}>
      <div className="flex justify-between items-start w-full gap-2">
        <div className="flex flex-col items-start gap-2">
          <h3 className="text-sm font-medium text-gray-600 first-letter:uppercase">{title}</h3>
          <div className="flex flex-col items-start mt-2">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        </div>
        <div>
          <div className={`p-2 rounded-full ${bgColor}`}>{icon}</div>
        </div>
      </div>
    </Card>
  );
}

function StatisticDepenseCardSkeleton() {
  return (
    <Card className={`p-6 flex flex-col items-center justify-center animate-pulse`}>
      <div className="flex justify-between items-start w-full gap-2">
        <div className="flex flex-col items-start gap-2">
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
          <div className="flex flex-col items-start mt-2">
            <div className="h-6 w-16 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div>
          <div className={`p-2 rounded-full bg-gray-300 h-10 w-10`}></div>
        </div>
      </div>
    </Card>
  );
}

export default StatisticDepenseCard;
