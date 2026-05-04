'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarInput } from '@/components/block/dateInput';

interface EntreeCaisseFiltersProps {
  filters: {
    search: string;
    debut: Date;
    fin: Date;
  };
  handleSearchChange: (search: string) => void;
  handleDateChange: (debut?: Date, fin?: Date) => void;
  handleReset: () => void;
}

export function EntreeCaisseFilters({
  filters,
  handleSearchChange,
  handleDateChange,
  handleReset,
}: EntreeCaisseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-lg border">
      <div className="space-y-1 flex-1 min-w-[200px]">
        <Label className="text-xs text-gray-500">Rechercher par libellé</Label>
        <Input
          placeholder="Libellé..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Date début</Label>
        <CalendarInput
          value={filters.debut}
          onChange={(date) => handleDateChange(date, filters.fin)}
          placeholder="Date début"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Date fin</Label>
        <CalendarInput
          value={filters.fin}
          onChange={(date) => handleDateChange(filters.debut, date)}
          placeholder="Date fin"
        />
      </div>
      <Button variant="ghost" size="sm" onClick={handleReset}>
        <X className="w-4 h-4 mr-1" />
        Réinitialiser
      </Button>
    </div>
  );
}
