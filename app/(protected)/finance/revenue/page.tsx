import RevenuePeriodChart from '@/feature-finance/revenus/components/revenue-period-chart';

export default function RevenuePage() {
  return (
    <div>
      {/* <RevenueGeneralClient/> */}
      <div className="mt-8">
        <RevenuePeriodChart />
      </div>
    </div>
  );
}