import { Boxes, CalendarClock } from 'lucide-react';
import { useDepenseStats } from '@/features/depenses/hooks/use-depense-stats';
import StatisticDepenseCard from '@/components/depenses/stats/statistic-depense-card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

export default function StatisticDepenseCards() {
  const { data, isLoading } = useDepenseStats();

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatisticDepenseCard isLoading={isLoading} title="Catégories" value={data?.nombre_categories} color="text-blue-600" bgColor="bg-blue-100" icon={<Boxes className="h-5 w-5" />} />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Nombre de dépense"
          value={data?.nombre_depenses}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Dépenses"
          value={formatCFA(data?.montant_total || 0)}
          color="text-green-600"
          bgColor="bg-green-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
