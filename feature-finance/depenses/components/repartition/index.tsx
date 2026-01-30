'use client';

import RepartitionDepensePieChart from '@/feature-finance/depenses/components/repartition/repartition-depense-pie-chart';
import DepenseLineChart from '@/feature-finance/depenses/components/repartition/depense-line-chart';

export default function RepartitionDepense() {
  return (
    <div className="grid grid-cols-5 gap-4">
      <RepartitionDepensePieChart className="col-span-2" />
      <DepenseLineChart className="col-span-3" />
    </div>
  );
}
