import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DeductionStatCard from '@/components/personnel/deductions/stats/deduction-stat-card';

function DeductionStatsOverview() {
  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: fr });
  const stats = [
    { label: 'Masse salariale brute', value: 1_180_000, color: 'default' as const },
    { label: 'Total absences', value: 95_000, color: 'red' as const },
    { label: 'Retards deduits', value: 45_000, color: 'orange' as const },
    { label: 'Avances recuperees', value: 220_000, color: 'green' as const },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <DeductionStatCard key={stat.label} label={stat.label} value={stat.value} description={monthLabel} color={stat.color} />
      ))}
    </div>
  );
}

export default DeductionStatsOverview;
