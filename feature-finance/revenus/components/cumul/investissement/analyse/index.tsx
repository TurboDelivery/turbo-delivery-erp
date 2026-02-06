'use client';

import InvestissementMonthlyChart from '@/feature-finance/revenus/components/cumul/investissement/analyse/repartition/investissement-monthly-chart';

export default function InvestissementAnalyse() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        <InvestissementMonthlyChart />
    </div>
  );
}
