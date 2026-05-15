'use client';

import Select from 'react-select';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';
import DateFilterInput from '@/components/finance/date-filter-input';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import type { DateRange } from 'react-day-picker';

export type SelectOption = { value: string; label: string };

export interface TicketFilters {
  search: string;
  numero: string;
  livreurId: string;
  restaurantId: string;
  debut: string;
  fin: string;
}

export const DEFAULT_TICKET_FILTERS: TicketFilters = {
  search: '',
  numero: '',
  livreurId: '',
  restaurantId: '',
  debut: '',
  fin: '',
};

/** Filtre client-side sur reference, livreurId, restaurantId */
export function applyTicketFilters<
  T extends { reference: string; livreurId: string; restaurantId: string },
>(items: T[], filters: TicketFilters): T[] {
  const s = filters.search.toLowerCase().trim();
  if (!s && !filters.livreurId && !filters.restaurantId) return items;
  return items.filter(
    (item) =>
      (!s || item.reference.toLowerCase().includes(s)) &&
      (!filters.livreurId || item.livreurId === filters.livreurId) &&
      (!filters.restaurantId || item.restaurantId === filters.restaurantId),
  );
}

interface Props {
  value: TicketFilters;
  onChange: (v: TicketFilters) => void;
  livreurOptions: SelectOption[];
}

export default function TicketFilterBar({ value, onChange, livreurOptions }: Props) {
  const debutDate = value.debut ? new Date(value.debut) : undefined;
  const finDate = value.fin ? new Date(value.fin) : undefined;

  const handleDateChange = (range: DateRange | undefined) => {
    onChange({
      ...value,
      debut: range?.from ? range.from.toISOString().split('T')[0] : '',
      fin: range?.to ? range.to.toISOString().split('T')[0] : '',
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium mb-1 text-gray-500">Code check</label>
        <Input
          size="sm"
          variant="bordered"
          placeholder="Rechercher par code check…"
          value={value.numero}
          onValueChange={(v) => onChange({ ...value, numero: v })}
          startContent={<Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
          isClearable
          onClear={() => onChange({ ...value, numero: '' })}
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium mb-1 text-gray-500">Livreur</label>
        <Select
          options={livreurOptions}
          value={livreurOptions.find((o) => o.value === value.livreurId) ?? null}
          onChange={(opt) => onChange({ ...value, livreurId: opt?.value ?? '' })}
          placeholder="Tous les livreurs"
          isClearable
          className="text-xs"
          classNamePrefix="react-select"
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium mb-1 text-gray-500">Restaurant</label>
        <RestaurantSelect
          value={value.restaurantId || undefined}
          onChange={(v) => onChange({ ...value, restaurantId: v ?? '' })}
          placeholder="Tous les restaurants"
          className="text-xs w-full"
        />
      </div>

      <div className="flex-1 min-w-[220px]">
        <DateFilterInput
          filters={{ debut: debutDate, fin: finDate }}
          handleDateChange={handleDateChange}
        />
      </div>
    </div>
  );
}
