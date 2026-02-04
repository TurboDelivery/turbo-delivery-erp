import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { IRecouvrement } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { StatCard } from './recouvrement-stat-card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import DateFilterInput from '@/components/finance/date-filter-input';
import useRecouvrementDashboard from '@/features/recouvrements/hooks/use-recouvrement-dashboard';

interface DetailRecouvrementProps {
  recouvrements: IRecouvrement[];
  factures: IFacture[];
}

export default function RecouvrementStatsBar({ recouvrements, factures }: DetailRecouvrementProps) {
  const { filters, handleDateChange } = useRecouvrementDashboard();
  // Calculer le total à recouvrir à partir des factures
  const totalARecouvrir = factures.reduce((total, facture) => {
    return total + facture.totalFraisLivraisons + facture.totalCommission;
  }, 0);

  // Calculer le total payé à partir des recouvrements
  const totalPayes = recouvrements.reduce((total, recouvrement) => {
    return total + recouvrement.montant;
  }, 0);

  // Calculer le reste à recouvrir
  const totalResteARecouvrir = totalARecouvrir - totalPayes;

  const recouvrementsData = [
    {
      title: 'Nombre de recouvrements',
      value: recouvrements.length,
      icon: <FileText className="h-5 w-5" />,
      colorVariant: 'blue' as const,
      formatValue: (value: number | string) => value.toLocaleString(),
    },
    {
      title: 'Total à recouvrir',
      value: totalARecouvrir,
      icon: <FileText className="h-5 w-5" />,
      colorVariant: 'purple' as const,
    },
    {
      title: 'Total payé',
      value: totalPayes,
      icon: <CheckCircle className="h-5 w-5" />,
      colorVariant: 'green' as const,
    },
    {
      title: 'Reste à recouvrir',
      value: totalResteARecouvrir,
      icon: <AlertCircle className="h-5 w-5" />,
      colorVariant: 'amber' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recouvrementsData.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} colorVariant={stat.colorVariant} formatValue={stat.formatValue || formatCFA} />
        ))}
      </div>
    </div>
  );
}
