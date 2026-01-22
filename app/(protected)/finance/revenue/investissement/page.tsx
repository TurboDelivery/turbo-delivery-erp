

import Statistics from "@/feature-finance/revenus/components/cumul/investissement/statistics";
import InvestissementAnalyse from "@/feature-finance/revenus/components/cumul/investissement/analyse";
import InvestissementList from "@/feature-finance/revenus/components/cumul/investissement/invest-list/invest-list";
import { prefetchInvestissementListQuery } from "@/feature-finance/revenus/queries/investissement/investissement-list.query";
import RevenusHeader from "@/components/components-finance/revenus/header";

export default function RevenueInvestissementPage() {

  prefetchInvestissementListQuery({
    limit: 10,
    page: 1
  })

  return (
    <div>
      <RevenusHeader title="Gestion des investissements" />
      
      {/* Affichage des statistiques et analyses */}
      <Statistics />
      <InvestissementAnalyse />
      
      {/* Liste des investissements */}
      <InvestissementList />
    </div>
  );
}
