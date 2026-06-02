'use client';

import { useQueryStates } from 'nuqs';
import { Button, Select, SelectItem } from '@heroui/react';
import {
  encoursFilters,
  useEncoursQuery,
  useEncoursGroupesQuery,
  MOIS_LONGS,
} from '@/features/encours';
import { EncoursTable } from './encours-table';
import { EncoursDeductionsTable } from './encours-deductions-table';

const anneeCourante = new Date().getFullYear();
const ANNEES = [anneeCourante, anneeCourante - 1, anneeCourante - 2, anneeCourante - 3];
const MOIS = Array.from({ length: 12 }, (_, i) => i + 1);

export function EncoursView() {
  const [filters, setFilters] = useQueryStates(encoursFilters.filter, encoursFilters.option);

  const params = {
    annee: filters.annee,
    mois: filters.mois ? Number(filters.mois) : null,
    partenaire: filters.partenaire || null,
  };

  const { data: releve, isLoading, isError } = useEncoursQuery(params);
  const { data: groupes } = useEncoursGroupesQuery();

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Encours — Restes à payer</h1>
          <p className="text-sm text-gray-500">
            Factures éditées non encore recouvrées (par mois / cumul annuel)
          </p>
        </div>
        <Button isDisabled variant="bordered" size="sm">
          Exporter (à venir)
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          label="Année"
          size="sm"
          className="w-32"
          selectedKeys={[String(filters.annee)]}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string;
            if (v) setFilters({ annee: Number(v) });
          }}
        >
          {ANNEES.map((y) => (
            <SelectItem key={String(y)} value={String(y)}>
              {String(y)}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Mois"
          size="sm"
          className="w-44"
          selectedKeys={[filters.mois || 'TOUS']}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string;
            setFilters({ mois: v === 'TOUS' ? '' : v });
          }}
        >
          {[
            <SelectItem key="TOUS" value="TOUS">
              Tous (cumul annuel)
            </SelectItem>,
            ...MOIS.map((m) => (
              <SelectItem key={String(m)} value={String(m)}>
                {MOIS_LONGS[m]}
              </SelectItem>
            )),
          ]}
        </Select>

        <Select
          label="Partenaire"
          size="sm"
          className="w-56"
          selectedKeys={[filters.partenaire || 'TOUS']}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string;
            setFilters({ partenaire: v === 'TOUS' ? '' : v });
          }}
        >
          {[
            <SelectItem key="TOUS" value="TOUS">
              Tous
            </SelectItem>,
            ...(groupes ?? []).map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            )),
          ]}
        </Select>
      </div>

      {isLoading && <div className="py-10 text-center text-sm text-gray-500">Chargement…</div>}
      {isError && <div className="py-10 text-center text-sm text-red-600">Erreur de chargement du relevé.</div>}

      {releve && !isLoading && (
        <div className="overflow-x-auto">
          <EncoursTable releve={releve} />
          <EncoursDeductionsTable deductions={releve.deductions} total={releve.totalDeductions} />
        </div>
      )}
    </div>
  );
}
