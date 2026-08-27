import React from 'react';
import { Select, SelectItem } from '@/components/heroui';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';

interface DeductionFiltersProps {
  filters: {
    employeeId: string;
    year: number;
    month: number;
  };
  handleEmployeeFilterChange: (employeeId?: string | null) => void;
  handleYearFilterChange: (year?: number) => void;
  handleMonthFilterChange: (month?: number) => void;
  onReset?: () => void;
}

const monthOptions = [
  { key: '1', label: 'Janvier' },
  { key: '2', label: 'Fevrier' },
  { key: '3', label: 'Mars' },
  { key: '4', label: 'Avril' },
  { key: '5', label: 'Mai' },
  { key: '6', label: 'Juin' },
  { key: '7', label: 'Juillet' },
  { key: '8', label: 'Aout' },
  { key: '9', label: 'Septembre' },
  { key: '10', label: 'Octobre' },
  { key: '11', label: 'Novembre' },
  { key: '12', label: 'Decembre' },
];

export function DeductionFilters({ filters, handleEmployeeFilterChange, handleYearFilterChange, handleMonthFilterChange, onReset }: DeductionFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtres déductions</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-2 h-4 w-4" />
            Reinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="deduction-employee-filter">Employé</Label>
          <EmployeeSelect value={filters.employeeId} onChange={(value) => handleEmployeeFilterChange(value || null)} className="text-xs w-full" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deduction-year-filter">Année</Label>
          <Select
            id="deduction-year-filter"
            placeholder="Sélectionner une année"
            selectedKeys={[String(filters.year)]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              handleYearFilterChange(Number(selected));
            }}
          >
            {years.map((year) => (
              <SelectItem key={String(year)} value={String(year)}>
                {String(year)}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deduction-month-filter">Mois</Label>
          <Select
            id="deduction-month-filter"
            placeholder="Sélectionner un mois"
            selectedKeys={[String(filters.month)]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              handleMonthFilterChange(Number(selected));
            }}
          >
            {monthOptions.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}

