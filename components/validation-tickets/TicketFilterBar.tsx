'use client';

import Select from 'react-select';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';

export type SelectOption = { value: string; label: string };

export interface TicketFilters {
  search: string;
  livreurId: string;
  restaurantId: string;
}

export const DEFAULT_TICKET_FILTERS: TicketFilters = {
  search: '',
  livreurId: '',
  restaurantId: '',
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
  restaurantOptions: SelectOption[];
}

export default function TicketFilterBar({ value, onChange, livreurOptions, restaurantOptions }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1 text-gray-500">Code check</label>
        <Input
          size="sm"
          variant="bordered"
          placeholder="Rechercher par code check…"
          value={value.search}
          onValueChange={(v) => onChange({ ...value, search: v })}
          startContent={<Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
          isClearable
          onClear={() => onChange({ ...value, search: '' })}
      
        />
      </div>

      <div className="flex-1">
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

      <div className="flex-1">
        <label className="block text-xs font-medium mb-1 text-gray-500">Restaurant</label>
        <Select
          options={restaurantOptions}
          value={restaurantOptions.find((o) => o.value === value.restaurantId) ?? null}
          onChange={(opt) => onChange({ ...value, restaurantId: opt?.value ?? '' })}
          placeholder="Tous les restaurants"
          isClearable
          className="text-xs"
          classNamePrefix="react-select"
        />
      </div>
    </div>
  );
}
