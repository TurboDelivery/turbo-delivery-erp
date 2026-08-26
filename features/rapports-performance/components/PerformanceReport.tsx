'use client';

import { usePerformanceStats } from '@/features/rapports-performance/hooks/use-performance-stats';
import { usePerformanceFilters } from '@/features/rapports-performance/hooks/use-performance-filters';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants';
import { PerformanceHeader } from './performance-header';
import { TopStatsSection } from './top-stats-section';
import { ChartsSection } from './charts-section';
import { MiddleStatsSection } from './middle-stats-section';
import { FinancialDetailsSection } from './financial-details-section';
import { PerformanceSummarySection } from './performance-summary-section';
import { exportPerformancePdf } from '../utils/performance-export.utils';

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

  const handleExportPdf = async () => {
    await exportPerformancePdf({
      mainKPIs,
      secondaryKPIs,
      financialDetails,
      selectedRestaurant,
      debut: filters.debut,
      fin: filters.fin,
    });
  };

  return (
    <div className="bg-gray-50 p-6">
      <PerformanceHeader
        selectedRestaurant={selectedRestaurant}
        restaurantId={filters.restaurantId || undefined}
        debut={filters.debut}
        fin={filters.fin}
        onDateChange={handleDateChange}
        onRestaurantChange={onRestaurantFilterChange}
        onExportPdf={handleExportPdf}
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

