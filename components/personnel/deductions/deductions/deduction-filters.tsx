'use client';

import { Button, Card } from '@heroui-v3/react';
import { X } from 'lucide-react';
import React from 'react';

import {
  ChampEnveloppe,
  ChampListe,
} from '@/components/commons/champs-formulaire';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';

interface DeductionFiltersProps {
  filters: {
    employeeId: string;
    month: number;
    year: number;
  };
  handleEmployeeFilterChange: (employeeId?: string | null) => void;
  handleMonthFilterChange: (month?: number) => void;
  handleYearFilterChange: (year?: number) => void;
  onReset?: () => void;
}

const MOIS = [
  { label: 'Janvier', value: '1' },
  { label: 'Février', value: '2' },
  { label: 'Mars', value: '3' },
  { label: 'Avril', value: '4' },
  { label: 'Mai', value: '5' },
  { label: 'Juin', value: '6' },
  { label: 'Juillet', value: '7' },
  { label: 'Août', value: '8' },
  { label: 'Septembre', value: '9' },
  { label: 'Octobre', value: '10' },
  { label: 'Novembre', value: '11' },
  { label: 'Décembre', value: '12' },
] as const;

/**
 * Les filtres des déductions.
 *
 * <p>Les libellés de mois étaient écrits sans accents — « Fevrier », « Aout »,
 * « Decembre » — sur un écran entièrement en français par ailleurs.</p>
 */
export function DeductionFilters({
  filters,
  handleEmployeeFilterChange,
  handleMonthFilterChange,
  handleYearFilterChange,
  onReset,
}: DeductionFiltersProps) {
  const currentYear = new Date().getFullYear();
  const annees = [currentYear - 1, currentYear, currentYear + 1].map((a) => ({
    label: String(a),
    value: String(a),
  }));

  return (
    <Card>
      <Card.Content className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground">Filtres déductions</h3>
          {onReset && (
            <Button onPress={onReset} size="sm" variant="ghost">
              <X aria-hidden="true" className="size-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChampEnveloppe label="Employé">
            <EmployeeSelect
              className="w-full"
              onChange={(value) => handleEmployeeFilterChange(value || null)}
              value={filters.employeeId}
            />
          </ChampEnveloppe>

          <ChampListe
            label="Année"
            onChange={(v) => handleYearFilterChange(Number(v))}
            options={annees}
            placeholder="Sélectionner une année"
            valeur={String(filters.year)}
          />

          <ChampListe
            label="Mois"
            onChange={(v) => handleMonthFilterChange(Number(v))}
            options={MOIS}
            placeholder="Sélectionner un mois"
            valeur={String(filters.month)}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
