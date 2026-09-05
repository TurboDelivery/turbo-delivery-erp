'use client';

import { useState } from 'react';
import { Button, Card, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
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

  const { stats, isLoading: isStatsLoading, isFetching: isStatsFetching, isError: isStatsError, refetch: refetchStats } = usePaiementsStats(filters.debut, filters.fin);

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
    supprimerDepenseDuMoisMutation.mutate({ id: deleteFixeTargetId, mois: filters.debut ?? '' }, { onSuccess: () => closeDeleteFixe() });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des paiements</h1>
          <p className="text-sm text-muted mt-1">Décaissez les charges approuvées</p>
        </div>
        <Can I="decaisser" a="Depense">
          {/* Le bouton etait `color="danger"` : le rouge du DANGER sur le geste
              principal de l'ecran, qui PAIE. Decaisser n'est pas detruire. */}
          <Button isDisabled={selectedIds.length === 0} onPress={() => setConfirmIds(selectedIds)} variant="primary">
            <Wallet aria-hidden="true" className="size-4" />
            Décaisser ({selectedIds.length})
          </Button>
        </Can>
      </div>

      {/* Month Picker */}
      <MonthPicker debut={filters.debut} fin={filters.fin} onChange={setFilters} />

      {/* Stats Cards */}
      {/* Sur echec, les trois cartes retombaient a 0 FCFA : un montant faux se lit
          comme un montant vrai. On remplace le bandeau au lieu de le laisser mentir. */}
      {isStatsError ? (
        <Card>
          <Card.Content>
            <EtatErreur enCours={isStatsFetching} onReessayer={() => refetchStats()} quoi="les montants à décaisser" />
          </Card.Content>
        </Card>
      ) : (
        <PaiementStatsCards stats={stats} isLoading={isStatsLoading} />
      )}

      {/* Charge Type Switcher + Filtre catégories */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        {/*
         * C'etaient deux `<button>` nus dont l'actif etait peint `bg-black text-white`
         * — du noir absolu, hors de tout theme — pour un choix EXCLUSIF, sans
         * navigation au clavier entre les deux options.
         */}
        <ToggleButtonGroup
          onSelectionChange={(sel) => {
            const v = Array.from(sel)[0];
            if (v) switchChargeType(v as ChargeTypeFilter);
          }}
          selectedKeys={new Set([chargeType])}
          selectionMode="single"
        >
          {CHARGE_TYPE_OPTIONS.map(({ label, value }) => (
            <ToggleButton id={value} key={value}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <CategoriesSelectFilter selectedCategories={depenseFilters.categoriesDepense || []} onCategoriesChange={handleCategoriesChange} />
      </div>

      {/* Table */}
      <Card>
        <Card.Content className="p-0">
          {/* Ecran de decaissement : sur echec, le tableau affichait « Aucune charge
            a decaisser » et laissait croire que tout etait paye. */}
          {isError ? (
            <div className="p-4">
              <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les charges à décaisser" />
            </div>
          ) : (
            <PaiementTable emptyMessage="Aucune charge à décaisser" isFetching={isFetching} isLoading={isLoading} pageCount={pageCount} renderMobileCard={renderMobileCard} table={table} />
          )}
        </Card.Content>
      </Card>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmIds.length > 0}
        onClose={closeConfirm}
        title="Confirmer le décaissement"
        isLoading={decaisserMutation.isPending}
        actions={[{ label: 'Décaisser', onPress: handleConfirmDecaisser, variante: 'danger' }]}
      >
        <p className="text-sm text-muted">
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
        actions={[{ label: 'Supprimer', onPress: handleConfirmDelete, variante: 'danger' }]}
      >
        <p className="text-sm text-muted">Voulez-vous vraiment supprimer cette charge variable ? Cette action est irréversible.</p>
      </ConfirmModal>

      {/* Delete Fixe Modal */}
      <ConfirmModal
        isOpen={!!deleteFixeTargetId}
        onClose={closeDeleteFixe}
        title="Supprimer la dépense du mois"
        isLoading={supprimerDepenseDuMoisMutation.isPending}
        actions={[{ label: 'Supprimer', onPress: handleConfirmDeleteFixe, variante: 'danger' }]}
      >
        <p className="text-sm text-muted">Voulez-vous vraiment supprimer la dépense du mois pour cette charge fixe ? Cette action est irréversible.</p>
      </ConfirmModal>
    </div>
  );
}
