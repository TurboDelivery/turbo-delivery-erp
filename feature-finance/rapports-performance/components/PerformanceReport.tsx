'use client';

import { usePerformanceStats } from '@/feature-finance/rapports-performance/hooks/use-performance-stats';
import { usePerformanceFilters } from '@/feature-finance/rapports-performance/hooks/use-performance-filters';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants';
import { PerformanceHeader } from './performance-header';
import { TopStatsSection } from './top-stats-section';
import { ChartsSection } from './charts-section';
import { MiddleStatsSection } from './middle-stats-section';
import { FinancialDetailsSection } from './financial-details-section';
import { PerformanceSummarySection } from './performance-summary-section';

export default function PerformanceReport() {
  const { data } = usePerformanceStats();
  const { filters, handleDateChange, handleRestaurantChange } = usePerformanceFilters();
  const { data: restaurants = [] } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  const geographicData = data?.geographicData ?? [];
  const weeklyActivityData = data?.weeklyActivity ?? [];
  const mainKPIs = data?.mainKPIs;
  const secondaryKPIs = data?.secondaryKPIs;
  const financialDetails = data?.financialDetails;
  const selectedRestaurant = restoOpts.find((o) => o.value === filters.restaurantId)?.label || 'Tous';

  const onRestaurantFilterChange = (value?: string) => {
    handleRestaurantChange(value ?? null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PerformanceHeader
        selectedRestaurant={selectedRestaurant}
        restaurantId={filters.restaurantId || undefined}
        debut={filters.debut}
        fin={filters.fin}
        onDateChange={handleDateChange}
        onRestaurantChange={onRestaurantFilterChange}
      />

      <div className="space-y-6">
        <TopStatsSection mainKPIs={mainKPIs} />
        <ChartsSection geographicData={geographicData} weeklyActivityData={weeklyActivityData} />
        <MiddleStatsSection secondaryKPIs={secondaryKPIs} />
        <FinancialDetailsSection financialDetails={financialDetails} />
        <PerformanceSummarySection
          mainKPIs={mainKPIs}
          secondaryKPIs={secondaryKPIs}
          selectedRestaurant={selectedRestaurant}
        />
      </div>
    </div>
  );
}

