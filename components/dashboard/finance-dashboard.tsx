import React from 'react';
import DashboardFinanceStatistics from '@/feature-finance/dashboard/components/dashboardFinanceStatistics';
import { ChartLineMultiple } from '@/feature-finance/dashboard/components/chart-line-multiple';

function FinanceDashboard() {
  return (
    <>
      <DashboardFinanceStatistics />
      <ChartLineMultiple />
    </>
  );
}

export default FinanceDashboard;