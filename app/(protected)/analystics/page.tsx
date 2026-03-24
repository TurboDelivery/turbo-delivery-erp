import React from 'react';
import DatabaseCards from '@/components/dashboard/apercu/DatabaseCards';
import FinanceDashboard from '@/components/dashboard/finance-dashboard';

export default async function Page() {
  return (
    <>
      <DatabaseCards />
      <FinanceDashboard />
    </>
  );
}
