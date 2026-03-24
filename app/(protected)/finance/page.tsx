'use client';

import FinanceQueryProvider from './finance-query-provider';
import DashboardFinanceStatistics from '@/feature-finance/dashboard/components/dashboardFinanceStatistics';
import DashboardHeader from '@/components/components-finance/dashboard/header';
import { ChartLineMultiple } from '@/feature-finance/dashboard/components/chart-line-multiple';

export default function Home() {
  return (
    <FinanceQueryProvider>
      <div>
        <DashboardHeader />
        <DashboardFinanceStatistics />
        <ChartLineMultiple />
      </div>
    </FinanceQueryProvider>
  );
}
