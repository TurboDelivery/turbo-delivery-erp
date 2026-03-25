
import React from 'react';
import { Select, SelectItem } from '@heroui/react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';

interface AbsenceFiltersProps {
  filters: {
    type: string;
    employeeId: string;
    periodeDebut: Date;
    periodeFin: Date;
  };
  handleTypeFilterChange: (type?: string | null) => void;
  handleEmployeeFilterChange: (employeeId?: string | null) => void;
  handlePeriodeFilterChange: (debut?: Date, fin?: Date) => void;
  onReset?: () => void;
}

const typeOptions = [
  { key: 'ABSENCE', label: 'Absence' },
  { key: 'RETARD', label: 'Retard' },
];

const parseDateInput = (value: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export function AbsenceFilters({ filters, handleTypeFilterChange, handleEmployeeFilterChange, handlePeriodeFilterChange, onReset }: AbsenceFiltersProps) {
  const handleDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePeriodeFilterChange(parseDateInput(e.target.value), filters.periodeFin);
  };

  const handleFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePeriodeFilterChange(filters.periodeDebut, parseDateInput(e.target.value));
  };

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtres absences</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-2 h-4 w-4" />
            Reinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="absence-employee-filter">Employe</Label>
          <EmployeeSelect value={filters.employeeId} onChange={(value) => handleEmployeeFilterChange(value || null)} className="text-xs w-full" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="absence-type-filter">Type</Label>
          <Select
            id="absence-type-filter"
            placeholder="Selectionner un type"
            selectedKeys={filters.type ? [filters.type] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              handleTypeFilterChange(selected || null);
            }}
          >
            {typeOptions.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="absence-debut-filter">Periode debut</Label>
          <Input id="absence-debut-filter" type="date" value={format(filters.periodeDebut, 'yyyy-MM-dd')} onChange={handleDebutChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="absence-fin-filter">Periode fin</Label>
          <Input id="absence-fin-filter" type="date" value={format(filters.periodeFin, 'yyyy-MM-dd')} onChange={handleFinChange} />
        </div>
      </div>
    </div>
  );
}
