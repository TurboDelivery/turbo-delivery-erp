'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, FileDown, Plus } from 'lucide-react';
import { Button, Card, Select, SelectItem } from '@heroui/react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Can } from '@/components/auth/Can';
import { useChargesDepensesV2 } from '../hooks/use-charges-depenses-v2';
import { useActionChargeVariableMutation } from '../queries/charge-variable.mutation';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';
import ChargesStatsCardsV2 from './statistiques/charges-stats-cards-v2';
import ChargesTableV2 from './charges-table-v2';
import { ChargesModals } from './charges-modals';
import { CategorieDepenseList } from '@/feature-finance/depenses/components/depense-list/categorie-depense';
import { buildMonthOptions, monthKeyToRange, rangeToMonthKey } from '../utils/month-filter.utils';
import RepartitionDepense from '@/feature-finance/depenses/components/repartition';
import { useDepenseExport } from '@/features/depenses/hooks/use-depense-export';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';

export default function ChargesPageContentV2() {
  // Modals state
  const [isFixeModalOpen, setIsFixeModalOpen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<IChargeFixe | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{ charge: IChargeFixe; enable: boolean } | null>(null);
  const [chargeToDelete, setChargeToDelete] = useState<IChargeFixe | null>(null);

  const actionVariableMutation = useActionChargeVariableMutation();

  const { fixesTable, variablesTable, isFixesLoading, isVariablesLoading, fixesRemainingCount, variablesRemainingCount, stats, isStatsLoading, filters, setFilters } = useChargesDepensesV2({
    onEditChargeFixe: (charge) => {
      setChargeToEdit(charge);
      setIsFixeModalOpen(true);
    },
    onDeleteChargeFixe: (charge) => setChargeToDelete(charge),
    onToggleChargeFixe: (charge, enabled) => setToggleTarget({ charge, enable: enabled }),
    onEditChargeVariable: (charge) => {
      setChargeVariableToEdit(charge);
      setIsVariableModalOpen(true);
    },
    onApproveChargeVariable: (charge) => actionVariableMutation.mutate({ id: charge.id, action: 'valider-dga', dto: { par: 'Utilisateur' } }),
    onRejectChargeVariable: (charge) => actionVariableMutation.mutate({ id: charge.id, action: 'rejeter-dga', dto: { par: 'Utilisateur' } }),
    onViewJustificatif: (url) => setPreviewUrl(url),
  });

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const selectedMonth = rangeToMonthKey(filters.debut);

  const filterDates = useMemo(
    () => ({
      debut: filters.debut ? new Date(filters.debut) : undefined,
      fin: filters.fin ? new Date(filters.fin) : undefined,
    }),
    [filters.debut, filters.fin],
  );

  const { filters: depenseFilters, handleCategoriesChange } = useDepenseDashboardFilters();
  const { exportDepensesToExcel, isLoadingDepenseExport } = useDepenseExport();

  const handleExport = useCallback(() => {
    exportDepensesToExcel({ debut: filterDates.debut, fin: filterDates.fin });
  }, [exportDepensesToExcel, filterDates]);

  const handleMonthChange = useCallback(
    (keys: Set<string> | unknown) => {
      const key = Array.from(keys as Iterable<string>)[0];
      setFilters(monthKeyToRange(key));
    },
    [setFilters],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Finance — Charges & Dépenses</h1>
          <p className="text-sm text-gray-500 mt-1">Pilotage de la rentabilité en temps réel</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button color="success" variant="flat" size="sm" isLoading={isLoadingDepenseExport} onPress={handleExport} startContent={!isLoadingDepenseExport && <FileDown size={16} />}>
            {isLoadingDepenseExport ? 'Exportation...' : 'Exporter (Excel)'}
          </Button>
          <Select selectedKeys={[selectedMonth]} onSelectionChange={handleMonthChange} className="w-full sm:w-[280px]" size="sm" aria-label="Période">
            {monthOptions.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <ChargesStatsCardsV2 stats={stats} isLoading={isStatsLoading} selectedMonth={selectedMonth} />
      <RepartitionDepense debut={filterDates.debut} fin={filterDates.fin} />

      {/* Filtre par catégories */}
      <div className="flex flex-wrap items-center gap-2">
        <CategoriesSelectFilter selectedCategories={depenseFilters.categoriesDepense || []} onCategoriesChange={handleCategoriesChange} />
      </div>

      {/* Tabs: Charges & Catégories */}
      <Tabs defaultValue="charges" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto p-1">
          <TabsTrigger value="charges">Charges Fixes</TabsTrigger>
          <TabsTrigger value="variables">Dépenses Variables</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="charges">
          <ChargesFixesSection
            table={fixesTable}
            isLoading={isFixesLoading}
            remainingCount={fixesRemainingCount}
            onAdd={() => {
              setChargeToEdit(null);
              setIsFixeModalOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="variables">
          <DepensesVariablesSection
            table={variablesTable}
            isLoading={isVariablesLoading}
            remainingCount={variablesRemainingCount}
            onAdd={() => {
              setChargeVariableToEdit(null);
              setIsVariableModalOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategorieDepenseList />
        </TabsContent>
      </Tabs>

      {/* All Modals */}
      <ChargesModals
        isFixeModalOpen={isFixeModalOpen}
        onCloseFixeModal={() => {
          setIsFixeModalOpen(false);
          setChargeToEdit(null);
        }}
        chargeToEdit={chargeToEdit}
        isVariableModalOpen={isVariableModalOpen}
        onCloseVariableModal={() => {
          setIsVariableModalOpen(false);
          setChargeVariableToEdit(null);
        }}
        chargeVariableToEdit={chargeVariableToEdit}
        toggleTarget={toggleTarget}
        onCloseToggle={() => setToggleTarget(null)}
        chargeToDelete={chargeToDelete}
        onCloseDelete={() => setChargeToDelete(null)}
        previewUrl={previewUrl}
        onClosePreview={() => setPreviewUrl(null)}
      />
    </div>
  );
}

// --- Sub-components ---

function ChargesFixesSection({
  table,
  isLoading,
  remainingCount,
  onAdd,
}: {
  table: ReturnType<typeof import('@tanstack/react-table').useReactTable<IChargeFixe>>;
  isLoading: boolean;
  remainingCount: number;
  onAdd: () => void;
}) {
  return (
    <Card className="border shadow-none overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Configuration des Charges Fixes</h2>
        <Can I="create" a="ChargeFixe">
          <Button color="danger" size="sm" startContent={<Plus size={16} />} onPress={onAdd}>
            Ajouter
          </Button>
        </Can>
      </div>
      <ChargesTableV2 table={table} isLoading={isLoading} emptyMessage="Aucune charge fixe configurée" getRowClassName={(row: IChargeFixe) => (row.automatique ? 'bg-green-100' : '')} />
      <div className="py-3 text-center border-t">
        <Link href="/finance/charges/details?tab=fixes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronDown size={14} /> Voir plus ({remainingCount} restantes)
        </Link>
      </div>
    </Card>
  );
}

function DepensesVariablesSection({
  table,
  isLoading,
  remainingCount,
  onAdd,
}: {
  table: ReturnType<typeof import('@tanstack/react-table').useReactTable<IChargeVariable>>;
  isLoading: boolean;
  remainingCount: number;
  onAdd: () => void;
}) {
  return (
    <Card className="border shadow-none overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Dépenses Variables</h2>
        <Can I="create" a="ChargeVariable">
          <Button color="danger" size="sm" startContent={<Plus size={16} />} onPress={onAdd}>
            Nouvelle dépense
          </Button>
        </Can>
      </div>
      <ChargesTableV2 table={table} isLoading={isLoading} emptyMessage="Aucune dépense variable" />
      <div className="py-3 text-center border-t">
        <Link href="/finance/charges/details?tab=variables" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronDown size={14} /> Voir plus ({remainingCount} restantes)
        </Link>
      </div>
    </Card>
  );
}
