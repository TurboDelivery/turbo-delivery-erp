'use client';

import React from 'react';
import { DateRangePicker, RangeValue } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import { DateRange } from 'react-day-picker';

type DateFilterInputProps = {
  filters: {
    debut?: Date | undefined;
    fin?: Date | undefined;
  };
  handleDateChange: (value: DateRange | undefined) => void;
  variant?: 'outline' | 'secondary';
};

function DateFilterInput({ filters, handleDateChange, variant = "secondary" }: DateFilterInputProps) {
  // Convertir Date vers DateValue pour HeroUI
  const convertToDateValue = (date: Date | undefined): DateValue | null => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return parseDate(`${year}-${month}-${day}`);
  };

  // Convertir DateValue vers Date pour la callback
  const handleHeroUIChange = (value: RangeValue<DateValue> | null) => {
    if (!value || !value.start || !value.end) {
      handleDateChange(undefined);
      return;
    }

    const fromDate = new Date(value.start.year, value.start.month - 1, value.start.day);
    const toDate = new Date(value.end.year, value.end.month - 1, value.end.day);

    handleDateChange({
      from: fromDate,
      to: toDate,
    });
  };

  const heroUIValue = filters.debut && filters.fin
    ? {
        start: convertToDateValue(filters.debut),
        end: convertToDateValue(filters.fin),
      }
    : null;

  return (
    <DateRangePicker
      className="max-w-xs w-full sm:w-[280px]"
      label="Période"
      value={heroUIValue as any}
      onChange={handleHeroUIChange}
      visibleMonths={2}
      color={variant === 'outline' ? 'default' : 'primary'}
      variant="bordered"
    />
  );
}

export default DateFilterInput;