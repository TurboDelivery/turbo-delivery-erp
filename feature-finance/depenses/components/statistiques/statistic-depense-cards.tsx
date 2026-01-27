import { Card } from '@/components/ui/card';
import { Boxes, CalendarClock } from 'lucide-react';
import { ICategorieDepense } from '@/feature-finance/depenses/types/categorie-depense.type';
import { IDepense } from '@/feature-finance/depenses/types/depense.type';

export default function StatisticDepenseCards() {
  // Configuration des statistiques à afficher
  const stats = [
    {
      title: 'Catégories',
      value: '5',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: <Boxes className="h-5 w-5" />,
    },
    {
      title: 'Dépenses',
      value: '3000 CFA',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: <CalendarClock className="h-5 w-5" />,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-6 flex flex-col items-center justify-center`}>
            <div className="flex justify-between items-start w-full gap-2">
              <div className="flex flex-col items-start gap-2">
                <h3 className="text-sm font-medium text-gray-600 capitalize">{stat.title}</h3>
                <div className="flex flex-col items-start mt-2">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
              <div>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>{stat.icon}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
