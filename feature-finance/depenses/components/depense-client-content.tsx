'use client';

import StatisticDepenseCards from '@/feature-finance/depenses/components/statistiques/statistic-depense-cards';
import RepartitionDepense from '@/feature-finance/depenses/components/repartition/index';
import DepenseTabs from '@/components/depenses/depense-table/depense-tabs';
import DepenseHeader from '@/components/components-finance/depenses/header';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

export default function DepenseClientContent() {
  const { filters, handleDateChange } = useDepenseDashboardFilters();

  return (
    <div className="flex flex-col gap-6 px-4">
      <DepenseHeader />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" data-empty={!filters.debut || !filters.fin} className="data-[empty=true]:text-muted-foreground w-full sm:w-[280px] justify-start text-left font-normal">
            <CalendarIcon />
            {filters.debut && filters.fin ? (
              <span className="ml-2">
                {format(new Date(filters.debut), 'dd/MM/yyyy')} - {format(new Date(filters.fin), 'dd/MM/yyyy')}
              </span>
            ) : (
              <span className="ml-2">Sélectionner une plage de dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            buttonVariant="ghost"
            selected={{
              from: filters.debut,
              to: filters.fin,
            }}
            onSelect={(value) => handleDateChange(value)}
          />
        </PopoverContent>
      </Popover>
      <StatisticDepenseCards />
      <RepartitionDepense />
      <DepenseTabs />
    </div>
  );
}
