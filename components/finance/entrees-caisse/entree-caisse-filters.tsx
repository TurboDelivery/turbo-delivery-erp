'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DateFilterInput from '@/components/finance/date-filter-input';
import type { DateRange } from 'react-day-picker';

interface EntreeCaisseFiltersProps {
  filters: {
    debut: Date;
    fin: Date;
  };
  handleDateChange: (range: DateRange | undefined) => void;
  handleReset: () => void;
}

export function EntreeCaisseFilters({
  filters,
  handleDateChange,
  handleReset,
}: EntreeCaisseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-lg border">
      <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      <Button variant="ghost" size="sm" onClick={handleReset}>
        <X className="w-4 h-4 mr-1" />
        Réinitialiser
      </Button>
    </div>
  );
}
