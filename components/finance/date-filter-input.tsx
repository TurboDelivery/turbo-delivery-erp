'use client';

import { DateField, DateRangePicker, Label, RangeCalendar } from '@heroui-v3/react';
import { type CalendarDate, type DateValue, parseDate } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { DateRange } from 'react-day-picker';

type DateFilterInputProps = {
  filters: {
    debut?: Date | undefined;
    fin?: Date | undefined;
  };
  handleDateChange: (value: DateRange | undefined) => void;
  /** Conservé pour ne pas toucher les points d'appel ; sans effet sur le rendu v3. */
  variant?: 'outline' | 'secondary';
};

/**
 * Le sélecteur de période partagé des écrans Finance.
 *
 * <p>C'était le `DateRangePicker` de la v2, avec `label`, `color` et `variant="bordered"`
 * — trois props que la v3 ignore EN SILENCE — et une valeur passée en `as any` pour
 * forcer le typage. La v3 est composée : le libellé, les deux champs de date, le
 * séparateur, le déclencheur et le calendrier sont des enfants nommés.</p>
 */
function DateFilterInput({ filters, handleDateChange }: DateFilterInputProps) {
  const enDateValue = (date: Date | undefined): DateValue | null => {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const jour = String(d.getDate()).padStart(2, '0');
    return parseDate(`${d.getFullYear()}-${mois}-${jour}`);
  };

  const valeur =
    filters.debut && filters.fin
      ? { end: enDateValue(filters.fin), start: enDateValue(filters.debut) }
      : null;

  return (
    <DateRangePicker
      className="w-full sm:w-[280px]"
      onChange={(v) => {
        if (!v?.start || !v.end) {
          handleDateChange(undefined);
          return;
        }
        handleDateChange({
          from: new Date(v.start.year, v.start.month - 1, v.start.day),
          to: new Date(v.end.year, v.end.month - 1, v.end.day),
        });
      }}
      value={valeur as never}
    >
      <Label>Période</Label>
      <DateField.Group>
        <DateField.Input slot="start">
          {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
            <DateField.Segment segment={segment} />
          )}
        </DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">
          {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
            <DateField.Segment segment={segment} />
          )}
        </DateField.Input>
        <DateRangePicker.Trigger>
          <CalendarDays aria-hidden="true" className="size-4" />
        </DateRangePicker.Trigger>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar>
          <RangeCalendar.Header>
            <RangeCalendar.NavButton slot="previous">
              <ChevronLeft aria-hidden="true" className="size-4" />
            </RangeCalendar.NavButton>
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="next">
              <ChevronRight aria-hidden="true" className="size-4" />
            </RangeCalendar.NavButton>
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(j: string) => <RangeCalendar.HeaderCell>{j}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(d: CalendarDate) => <RangeCalendar.Cell date={d} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}

export default DateFilterInput;
