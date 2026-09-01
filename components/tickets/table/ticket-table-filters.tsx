'use client';

import React from 'react';
import Select from 'react-select';
import { Input } from '@/components/heroui';
import { Search } from 'lucide-react';
import { ITicketParams } from '@/features/tickets/types/tickets.type';

interface TicketTableFiltersProps {
  search: string;
  livreurId: string;
  restaurantId: string;
  debut: Date;
  fin: Date;
  livreurOptions: { value: string; label: string }[];
  restaurantOptions: { value: string; label: string }[];
  onFilterChange: <K extends keyof ITicketParams>(key: K, value: string | Date | number) => void;
}

export function TicketTableFilters({
  search,
  livreurId,
  restaurantId,
  debut,
  fin,
  livreurOptions,
  restaurantOptions,
  onFilterChange,
}: TicketTableFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <Input
        startContent={<Search />}
        value={search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        placeholder="Code check"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1">Filtrer par Livreur</label>
          <Select
            options={livreurOptions}
            value={livreurOptions.find((o) => o.value === livreurId) ?? null}
            onChange={(opt) => onFilterChange('livreurId', opt?.value ?? '')}
            placeholder="Tous les livreurs"
            isClearable
            className="text-xs"
            classNamePrefix="react-select"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Filtrer par Restaurant</label>
          <Select
            options={restaurantOptions}
            value={restaurantOptions.find((o) => o.value === restaurantId) ?? null}
            onChange={(opt) => onFilterChange('restaurantId', opt?.value ?? '')}
            placeholder="Tous les restaurants"
            isClearable
            className="text-xs"
            classNamePrefix="react-select"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium mb-1">Filtrer par Date</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={debut.toISOString().split('T')[0]}
              onChange={(e) => onFilterChange('debut', e.target.value)}
              className="flex-1 h-9 p-2 border border-gray-200 rounded text-xs outline-hidden"
            />
            <input
              type="date"
              value={fin.toISOString().split('T')[0]}
              onChange={(e) => onFilterChange('fin', e.target.value)}
              className="flex-1 h-9 p-2 border border-gray-200 rounded text-xs outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

