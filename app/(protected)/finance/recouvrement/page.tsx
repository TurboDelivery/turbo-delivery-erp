'use client';

import RecouvrementContentTabs from '@/components/finance/recouvrements/recouvrement-content-tabs';
import RecouvrementStatsBar from '@/components/finance/recouvrements/stats/recouvrement-stats-bar';

export default function RecouvrementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <RecouvrementStatsBar />
      <RecouvrementContentTabs />
    </div>
  );
}
