'use client';

import { Input } from '@heroui/react';
import { Search, User, Store } from 'lucide-react';

export interface TicketFilters {
  search: string;
  livreur: string;
  restaurant: string;
}

export const DEFAULT_TICKET_FILTERS: TicketFilters = {
  search: '',
  livreur: '',
  restaurant: '',
};

/** Filtre client-side sur reference, livreur, restaurant */
export function applyTicketFilters<
  T extends { reference: string; livreur: string; restaurant: string },
>(items: T[], filters: TicketFilters): T[] {
  const s = filters.search.toLowerCase().trim();
  const l = filters.livreur.toLowerCase().trim();
  const r = filters.restaurant.toLowerCase().trim();
  if (!s && !l && !r) return items;
  return items.filter(
    (item) =>
      (!s || item.reference.toLowerCase().includes(s)) &&
      (!l || item.livreur.toLowerCase().includes(l)) &&
      (!r || item.restaurant.toLowerCase().includes(r)),
  );
}

interface Props {
  value: TicketFilters;
  onChange: (v: TicketFilters) => void;
}

export default function TicketFilterBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        size="sm"
        variant="bordered"
        placeholder="Rechercher par code check…"
        value={value.search}
        onValueChange={(v) => onChange({ ...value, search: v })}
        startContent={<Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
        className="flex-1"
        isClearable
        onClear={() => onChange({ ...value, search: '' })}
      />
      <Input
        size="sm"
        variant="bordered"
        placeholder="Filtrer par livreur…"
        value={value.livreur}
        onValueChange={(v) => onChange({ ...value, livreur: v })}
        startContent={<User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
        className="flex-1"
        isClearable
        onClear={() => onChange({ ...value, livreur: '' })}
      />
      <Input
        size="sm"
        variant="bordered"
        placeholder="Filtrer par restaurant…"
        value={value.restaurant}
        onValueChange={(v) => onChange({ ...value, restaurant: v })}
        startContent={<Store className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
        className="flex-1"
        isClearable
        onClear={() => onChange({ ...value, restaurant: '' })}
      />
    </div>
  );
}
