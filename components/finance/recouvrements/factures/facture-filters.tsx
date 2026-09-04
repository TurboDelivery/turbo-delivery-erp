'use client';
import React from 'react';
import { Select, SelectItem } from '@/components/heroui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { RestaurantSelect } from '../common/restaurant-select';

interface FactureFiltersProps {
  filters: {
    type: string;
    statut: string;
    periodeDebut: Date;
    periodeFin: Date;
    restaurantId?: string;
  };
  handleTypeFilterChange: (type?: string | null) => void;
  handleStatutFilterChange: (statut?: string | null) => void;
  handlePeriodeFilterChange: (debut?: Date, fin?: Date) => void;
  handleRestaurantFilterChange?: (restaurantId?: string | null) => void;
  onReset?: () => void;
  restaurants?: Array<{ label: string; value: string }>;
  restaurantsLoading?: boolean;
}

const statutOptions = [
  { key: 'PAID', label: 'Payée' },
  { key: 'DRAFT', label: 'Brouillon' },
  { key: 'PARTIAL', label: 'Partiellement payée' },
  { key: 'VALIDATED', label: 'Validée - non payée' },
];

export function FactureFilters({ filters, handleStatutFilterChange, handlePeriodeFilterChange, handleRestaurantFilterChange, onReset, restaurants, restaurantsLoading }: FactureFiltersProps) {
  /*
   * Un champ de date VIDE rendait une date invalide.
   *
   * <p>`new Date('')` rend `Invalid Date`, qui est un objet donc TRUTHY : les gardes
   * `debut ? … : valeurDefaut` la laissaient passer, et la borne partait invalide
   * jusqu'au formatage, ou elle jetait une `RangeError`. Vider le champ pour resaisir
   * une periode faisait donc tomber le filtre et perdait la saisie en cours.</p>
   *
   * <p>Une date qu'on ne sait pas lire n'est pas propagee : la borne precedente tient
   * jusqu'a ce qu'une date valide arrive.</p>
   */
  const enDateValide = (valeur: string): Date | undefined => {
    if (!valeur) return undefined;
    const d = new Date(valeur);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const handleDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = enDateValide(e.target.value);
    if (!d) return;
    handlePeriodeFilterChange(d, filters.periodeFin);
  };
  const handleFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = enDateValide(e.target.value);
    if (!d) return;
    handlePeriodeFilterChange(filters.periodeDebut, d);
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
        {/* ✅ AJOUTÉ: Filtre par restaurant */}
        <div className="space-y-2">
          <Label htmlFor="restaurant-filter">Restaurant</Label>
          <RestaurantSelect
            value={filters.restaurantId}
            onChange={(value?: string) => handleRestaurantFilterChange?.(value)}
            options={restaurants || []}
            isLoading={restaurantsLoading}
            placeholder="Sélectionner un restaurant"
          />
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
          <Input id="debut-filter" type="date" value={filters.periodeDebut.toISOString().split('T')[0] || ''} onChange={handleDebutChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fin-filter">Période Fin</Label>
          <Input id="fin-filter" type="date" value={filters.periodeFin.toISOString().split('T')[0] || ''} onChange={handleFinChange} />
        </div>
      </div>
    </div>
  );
}
