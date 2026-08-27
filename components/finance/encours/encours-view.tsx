'use client';

import { useQueryStates } from 'nuqs';
import { Select, SelectItem, Spinner } from '@/components/heroui';
import {
  encoursFilters,
  useEncoursQuery,
  useEncoursGroupesQuery,
  MOIS_LONGS,
} from '@/features/encours';
import { EncoursKpiCards } from './encours-kpi-cards';
import { EncoursCharts } from './encours-charts';
import { EncoursTable } from './encours-table';
import { EncoursMobileCards } from './encours-mobile-cards';
import { EncoursDeductionsTable } from './encours-deductions-table';
import { EncoursDeductionsManager } from './encours-deductions-manager';
import { EncoursExportButton } from './encours-export-button';
import { EncoursExportDusButton } from './encours-export-dus-button';
import { EncoursStoreFilter } from './encours-store-filter';

const anneeCourante = new Date().getFullYear();
const ANNEES = [anneeCourante, anneeCourante - 1, anneeCourante - 2, anneeCourante - 3];
const MOIS = Array.from({ length: 12 }, (_, i) => i + 1);
const CYCLES = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'MENSUEL', label: 'Mensuel' },
  { key: 'QUINZAINE', label: 'Quinzaine' },
  { key: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
];

export function EncoursView() {
  const [filters, setFilters] = useQueryStates(encoursFilters.filter, encoursFilters.option);

  const params = {
    annee: filters.annee,
    mois: filters.mois ? Number(filters.mois) : null,
    cycle: filters.cycle || null,
    partenaire: filters.partenaire || null,
    stores: filters.stores ?? [],
  };

  const { data: releve, isLoading, isError } = useEncoursQuery(params);
  const { data: groupes } = useEncoursGroupesQuery();

  return (
    <div className="space-y-4 p-3 sm:p-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Encours — Restes à payer</h1>
          <p className="text-sm text-default-500">
            Factures éditées non encore recouvrées — détail par facture (mois / quinzaine / semaine)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EncoursDeductionsManager annee={filters.annee} />
          <EncoursExportDusButton releve={releve} params={params} isDisabled={isLoading} />
          <EncoursExportButton params={params} isDisabled={!releve || isLoading} />
        </div>
      </div>

      {/* Filtres (responsives : 2 colonnes en mobile, ligne en desktop) */}
      <div className="grid grid-cols-2 items-end gap-2 rounded-xl border border-default-200 bg-content1 p-3 sm:flex sm:flex-wrap sm:gap-3">
        <Select
          label="Année"
          size="sm"
          className="w-full sm:w-28"
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
          className="w-full sm:w-40"
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
          label="Cycle"
          size="sm"
          className="w-full sm:w-40"
          selectedKeys={[filters.cycle || 'TOUS']}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string;
            setFilters({ cycle: v === 'TOUS' ? '' : v });
          }}
        >
          {CYCLES.map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {c.label}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Partenaire"
          size="sm"
          className="w-full sm:w-56"
          selectedKeys={[filters.partenaire || 'TOUS']}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string;
            // changer de partenaire réinitialise la sélection de points de vente (§4)
            setFilters({ partenaire: v === 'TOUS' ? '' : v, stores: [] });
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

        <div className="col-span-2 sm:contents">
          <EncoursStoreFilter
            partenaire={filters.partenaire}
            value={filters.stores ?? []}
            onChange={(ids) => setFilters({ stores: ids })}
          />
        </div>
      </div>

      {/* États */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-default-500">
          <Spinner size="sm" color="primary" /> Chargement du relevé…
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 py-10 text-center text-sm text-rose-600">
          Erreur de chargement du relevé.
        </div>
      )}

      {/* Contenu */}
      {releve && !isLoading && (
        <div className="space-y-4">
          <EncoursKpiCards releve={releve} />
          <EncoursCharts releve={releve} />
          {/* Desktop : tableau détaillé ; Mobile : cartes tactiles */}
          <div className="hidden md:block">
            <EncoursTable releve={releve} />
          </div>
          <div className="md:hidden">
            <EncoursMobileCards releve={releve} />
          </div>
          <EncoursDeductionsTable deductions={releve.deductions} total={releve.totalDeductions} />
        </div>
      )}
    </div>
  );
}
