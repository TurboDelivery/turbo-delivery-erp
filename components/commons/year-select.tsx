import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface YearSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  startYear?: number;
  placeholder?: string;
  className?: string;
}

function YearSelect({ value, onChange, startYear = 2023, placeholder = 'Sélectionner une année', className }: YearSelectProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || 'w-full max-w-48'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Année</SelectLabel>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default YearSelect;
