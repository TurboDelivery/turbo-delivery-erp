'use client';
import React from 'react';
import { Select, SelectItem } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
interface FactureFiltersProps {
  filters: {
    type: string;
    statut: string;
    periodeDebut: Date;
    periodeFin: Date;
  };
  handleTypeFilterChange: (type?: string | null) => void;
  handleStatutFilterChange: (statut?: string | null) => void;
  handlePeriodeFilterChange: (debut?: Date, fin?: Date) => void;
  onReset?: () => void;
}

const statutOptions = [
  { key: 'PAID', label: 'Payée' },
  { key: 'NOT_PAID', label: 'Non payée' },
  { key: 'DRAFT', label: 'Brouillon' },
];

export function FactureFilters({
  filters,
  handleStatutFilterChange,
  handlePeriodeFilterChange,
  onReset,
}: FactureFiltersProps) {
  const handleDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePeriodeFilterChange(new Date(e.target.value), filters.periodeFin);
  };
  const handleFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePeriodeFilterChange(filters.periodeDebut, new Date(e.target.value));
  };
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtres</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="statut-filter">Statut</Label>
          <Select
            id="statut-filter"
            placeholder="Sélectionner un statut"
            selectedKeys={filters.statut ? [filters.statut] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              handleStatutFilterChange(selected || null);
            }}
          >
            {statutOptions.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="debut-filter">Période Début</Label>
          <Input
            id="debut-filter"
            type="date"
            value={filters.periodeDebut.toISOString().split('T')[0] || ''}
            onChange={handleDebutChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fin-filter">Période Fin</Label>
          <Input
            id="fin-filter"
            type="date"
            value={filters.periodeFin.toISOString().split('T')[0] || ''}
            onChange={handleFinChange}
          />
        </div>
      </div>
    </div>
  );
}