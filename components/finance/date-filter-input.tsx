'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

type DateFilterInputProps = {
  filters: {
    debut?: Date | undefined;
    fin?: Date | undefined;
  };
  handleDateChange: (value: DateRange | undefined) => void;
};

function DateFilterInput({filters, handleDateChange}: DateFilterInputProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" data-empty={!filters.debut || !filters.fin} className="data-[empty=true]:text-muted-foreground w-full sm:w-[280px] justify-start text-left font-normal bg-yellow-100 hover:bg-yellow-200 border-yellow-300">
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
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          buttonVariant="ghost"
          selected={{
            from: filters.debut,
            to: filters.fin,
          }}
          onSelect={(value) => handleDateChange(value)}
          defaultMonth={filters.debut}
          numberOfMonths={2}
          disabled={{ before: new Date(2025, 0, 1) }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DateFilterInput;