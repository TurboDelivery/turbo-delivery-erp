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
    periodeDebut: string;
    periodeFin: string;
  };
  handleTypeFilterChange: (type?: string | null) => void;
  handleStatutFilterChange: (statut?: string | null) => void;
  handlePeriodeFilterChange: (debut?: string, fin?: string) => void;
  onReset?: () => void;
}
const typeOptions = [
  { key: 'LIVRAISON', label: 'Livraison' },
  { key: 'COMMISSION', label: 'Commission' },
  { key: 'MENSUELLE', label: 'Mensuelle' },
];
const statutOptions = [
  { key: 'PAYEE', label: 'Payée' },
  { key: 'EN_ATTENTE', label: 'En attente' },
  { key: 'ANNULEE', label: 'Annulée' },
];
export function FactureFilters({
  filters,
  handleTypeFilterChange,
  handleStatutFilterChange,
  handlePeriodeFilterChange,
  onReset,
}: FactureFiltersProps) {
  const handleDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePeriodeFilterChange(e.target.value, filters.periodeFin);
  };
  const handleFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePeriodeFilterChange(filters.periodeDebut, e.target.value);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type-filter">Type</Label>
          <Select
            id="type-filter"
            placeholder="Sélectionner un type"
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
            value={filters.periodeDebut || ''}
            onChange={handleDebutChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fin-filter">Période Fin</Label>
          <Input
            id="fin-filter"
            type="date"
            value={filters.periodeFin || ''}
            onChange={handleFinChange}
          />
        </div>
      </div>
    </div>
  );
}