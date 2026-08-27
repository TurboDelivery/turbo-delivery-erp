'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/heroui';
import { Wallet } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import ConfirmModal from '@/components/ui/confirm-modal';
import { Can } from '@/components/auth/Can';
import { paiementFiltersClient } from '../filters/paiement.filters';
import { usePaiementsTable, ChargeTypeFilter } from '../hooks/use-paiements-table';
import { usePaiementsStats } from '../hooks/use-paiements-stats';
import PaiementStatsCards from './paiement-stats-cards';
import PaiementTable from './paiement-table';
import { MonthPicker } from './month-picker';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import EtatErreur from '@/components/commons/EtatErreur';

const CHARGE_TYPE_OPTIONS: { value: ChargeTypeFilter; label: string }[] = [
  { value: 'variable', label: 'Charges variables' },
  { value: 'fixe', label: 'Charges fixes' },
];

export default function PaymentManagementV2() {
  const [filters, setFilters] = useQueryStates(paiementFiltersClient.filters, paiementFiltersClient.options);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteFixeTargetId, setDeleteFixeTargetId] = useState<string | null>(null);

  const { filters: depenseFilters, handleCategoriesChange } = useDepenseDashboardFilters();

  const {
    table,
    renderMobileCard,
    isLoading,
    isFetching,
    isError,
    refetch,
    selectedIds,
    pageCount,
    chargeType,
    switchChargeType,
    decaisserMutation,
    supprimerChargeVariableMutation,
    supprimerDepenseDuMoisMutation,
  } = usePaiementsTable(filters.debut, filters.fin, setConfirmIds, setDeleteTargetId, setDeleteFixeTargetId, depenseFilters.categoriesDepense || []);

  const { stats, isLoading: isStatsLoading } = usePaiementsStats(filters.debut, filters.fin);

  const closeConfirm = () => setConfirmIds([]);
  const closeDelete = () => setDeleteTargetId(null);
  const closeDeleteFixe = () => setDeleteFixeTargetId(null);

  const handleConfirmDecaisser = () => {
    decaisserMutation.mutate(confirmIds, {
      onSuccess: () => closeConfirm(),
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    supprimerChargeVariableMutation.mutate(deleteTargetId, {
      onSuccess: () => closeDelete(),
    });
  };

  const handleConfirmDeleteFixe = () => {
    if (!deleteFixeTargetId) return;
    supprimerDepenseDuMoisMutation.mutate(
      { id: deleteFixeTargetId, mois: filters.debut ?? '' },
      { onSuccess: () => closeDeleteFixe() },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestion des Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">Décaissez les charges approuvées</p>
        </div>
        <Can I="decaisser" a="Depense">
          <Button color="danger" startContent={<Wallet size={16} />} onPress={() => setConfirmIds(selectedIds)} isDisabled={selectedIds.length === 0}>
            Décaisser ({selectedIds.length})
          </Button>
        </Can>
      </div>

      {/* Month Picker */}
      <MonthPicker debut={filters.debut} fin={filters.fin} onChange={setFilters} />

      {/* Stats Cards */}
      <PaiementStatsCards stats={stats} isLoading={isStatsLoading} />
      
      {/* Charge Type Switcher + Filtre catégories */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          {CHARGE_TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => switchChargeType(value)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${chargeType === value ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <CategoriesSelectFilter
          selectedCategories={depenseFilters.categoriesDepense || []}
          onCategoriesChange={handleCategoriesChange}
        />
      </div>

      {/* Table */}
      <Card className="border shadow-none overflow-hidden">
        {/* Ecran de decaissement : sur echec, le tableau affichait « Aucune charge
            a decaisser » et laissait croire que tout etait paye. */}
        {isError ? (
          <EtatErreur
            quoi="les charges à décaisser"
            onReessayer={() => refetch()}
            enCours={isFetching}
          />
        ) : (
          <PaiementTable table={table} isLoading={isLoading} isFetching={isFetching} pageCount={pageCount} emptyMessage="Aucune charge à décaisser" renderMobileCard={renderMobileCard} />
        )}
      </Card>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmIds.length > 0}
        onClose={closeConfirm}
        title="Confirmer le décaissement"
        isLoading={decaisserMutation.isPending}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: closeConfirm },
          { label: 'Décaisser', color: 'danger', onPress: handleConfirmDecaisser },
        ]}
      >
        <p className="text-sm text-gray-600">
          Vous êtes sur le point de décaisser{' '}
          <span className="font-semibold">
            {confirmIds.length} charge{confirmIds.length > 1 ? 's' : ''}
          </span>
          . Cette action est irréversible.
        </p>
      </ConfirmModal>

      {/* Delete Variable Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={closeDelete}
        title="Supprimer la charge variable"
        isLoading={supprimerChargeVariableMutation.isPending}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: closeDelete },
          { label: 'Supprimer', color: 'danger', onPress: handleConfirmDelete },
        ]}
      >
        <p className="text-sm text-gray-600">Voulez-vous vraiment supprimer cette charge variable ? Cette action est irréversible.</p>
      </ConfirmModal>

      {/* Delete Fixe Modal */}
      <ConfirmModal
        isOpen={!!deleteFixeTargetId}
        onClose={closeDeleteFixe}
        title="Supprimer la dépense du mois"
        isLoading={supprimerDepenseDuMoisMutation.isPending}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: closeDeleteFixe },
          { label: 'Supprimer', color: 'danger', onPress: handleConfirmDeleteFixe },
        ]}
      >
        <p className="text-sm text-gray-600">Voulez-vous vraiment supprimer la dépense du mois pour cette charge fixe ? Cette action est irréversible.</p>
      </ConfirmModal>
    </div>
  );
}
