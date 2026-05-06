import React from 'react';
import DashboardFinanceStatistics from '@/features/finance-dashboard/components/dashboardFinanceStatistics';
import { ChartLineMultiple } from '@/features/finance-dashboard/components/chart-line-multiple';

function FinanceDashboard() {
  return (
    <>
      <DashboardFinanceStatistics />
      <ChartLineMultiple />
    </>
  );
}

export default FinanceDashboard;