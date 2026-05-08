import { Boxes, CalendarClock } from 'lucide-react';
import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import { useDepensesListQuery } from '@/features/depenses/queries/depense-list.query';
import StatisticDepenseCard from '@/components/depenses/stats/statistic-depense-card';
import { formatCfa } from '@/utils/format.utils';
import { IDepenseStatsParams, IDepensesParams } from '@/features/depenses/types/depense.type';

interface StatisticDepenseCardsProps {
  filters: {
    debut?: Date;
    fin?: Date;
    categoriesDepense?: string[] | null;
  };
}

export default function StatisticDepenseCards({ filters }: StatisticDepenseCardsProps) {
  const currentSearchParams: IDepenseStatsParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense || undefined,
  };

  // Utiliser les stats de l'API (non filtrées par catégories pour le moment)
  const { data: statsData, isLoading: statsLoading } = useDepenseStatsQuery(currentSearchParams);

  // Récupérer toutes les dépenses pour filtrer localement
  const depensesParams: IDepensesParams = {
    page: 0,
    limit: 1000, // Beaucoup pour avoir toutes les données
    debut: filters.debut,
    fin: filters.fin,
  };
  const { data: depensesData, isLoading: depensesLoading } = useDepensesListQuery(depensesParams);

  // Filtrer localement par catégories si nécessaire
  const filteredDepenses = depensesData?.content?.filter(depense => {
    if (!filters.categoriesDepense || filters.categoriesDepense.length === 0) {
      return true; // Pas de filtre de catégories
    }
    return filters.categoriesDepense.includes(depense.categorie?.id || '');
  }) || [];

  // Calculer les stats localement
  const localStats = {
    nombre_categories: new Set(filteredDepenses.map(d => d.categorie?.id)).size,
    nombre_depenses: filteredDepenses.length,
    montant_total: filteredDepenses.reduce((sum, d) => sum + (d.montant || 0), 0),
  };

  // Utiliser les stats locales si filtre de catégories, sinon utiliser les stats API
  const displayStats = (filters.categoriesDepense && filters.categoriesDepense.length > 0) ? localStats : statsData;

  const isLoading = statsLoading || depensesLoading;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatisticDepenseCard isLoading={isLoading} title="Catégories" value={displayStats?.nombre_categories} color="text-blue-600" bgColor="bg-blue-100" icon={<Boxes className="h-5 w-5" />} />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Nombre de dépense"
          value={displayStats?.nombre_depenses}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Dépenses"
          value={formatCfa(displayStats?.montant_total || 0)}
          color="text-green-600"
          bgColor="bg-green-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

