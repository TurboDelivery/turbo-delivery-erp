'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreerEntreeCaisseModal } from '@/components/finance/entrees-caisse/creer-entree-caisse-modal';

interface DashboardHeaderProps {
  selectedYear: string;
  years: string[];
  onYearChange: (year: string) => void;
}

export function DashboardHeader({ selectedYear, years, onYearChange }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-bold text-primary">
          Bilan Annuel {selectedYear}
        </h1>
        <div className="flex items-center gap-3">
          <CreerEntreeCaisseModal />
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted">
        Vue chronologique de la santé financière et opérationnelle
      </p>
    </div>
  );
}
