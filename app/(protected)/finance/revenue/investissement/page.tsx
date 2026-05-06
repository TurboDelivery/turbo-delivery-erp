import InvestissementStatsBar from '@/features/revenus/components/cumul/investissement/stats/investissement-stats-bar';
import InvestissementAnalyse from '@/features/revenus/components/cumul/investissement/analyse';
import InvestissementList from '@/features/revenus/components/cumul/investissement/invest-list/invest-list';
import RevenusHeader from '@/components/components-finance/revenus/header';

export default function RevenueInvestissementPage() {
  return (
    <div>
      <RevenusHeader title="Gestion des investissements" />

      {/* Affichage des statistiques et analyses */}
      <InvestissementStatsBar />
      <InvestissementAnalyse />

      {/* Liste des investissements */}
      <InvestissementList />
    </div>
  );
}
