'use client';
import { CalendarInput } from '@/components/components-finance/block/dateInput';
import { InvestissementFilters } from '@/feature-finance/revenus/hooks/use-investissement-list';

interface InvestissementDateFilterProps {
  dateInvestissement: string;
  onFilterChange: (filterName: keyof InvestissementFilters, value: string) => void;
}

export default function InvestissementDateFilter({ dateInvestissement, onFilterChange }: InvestissementDateFilterProps) {
  const handleDateChange = (date: Date | undefined) => {
    const dateStr = date ? date.toISOString().split('T')[0] : '';
    onFilterChange('dateInvestissement', dateStr);
  };

  return <CalendarInput value={dateInvestissement ? new Date(dateInvestissement) : undefined} onChange={handleDateChange} placeholder="Date d'investissement" className="w-full" />;
}
