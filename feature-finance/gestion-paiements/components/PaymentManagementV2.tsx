'use client';

import { useState } from 'react';
import { Button, Card } from '@heroui/react';
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

const CHARGE_TYPE_OPTIONS: { value: ChargeTypeFilter; label: string }[] = [
  { value: 'variable', label: 'Charges variables' },
  { value: 'fixe', label: 'Charges fixes' },
];

export default function PaymentManagementV2() {
  const [filters, setFilters] = useQueryStates(paiementFiltersClient.filters, paiementFiltersClient.options);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  const {
    table,
    isLoading,
    isFetching,
    selectedIds,
    pageCount,
    chargeType,
    switchChargeType,
    decaisserMutation,
  } = usePaiementsTable(filters.debut, filters.fin, setConfirmIds);

  const { stats, isLoading: isStatsLoading } = usePaiementsStats(filters.debut, filters.fin);

  const closeConfirm = () => setConfirmIds([]);

  const handleConfirmDecaisser = () => {
    decaisserMutation.mutate(confirmIds, {
      onSuccess: () => closeConfirm(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Gestion des Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">Décaissez les charges approuvées</p>
        </div>
        <Can I="decaisser" a="Depense">
          <Button
            color="danger"
            startContent={<Wallet size={16} />}
            onPress={() => setConfirmIds(selectedIds)}
            isDisabled={selectedIds.length === 0}
          >
            Décaisser ({selectedIds.length})
          </Button>
        </Can>
      </div>

      {/* Charge Type Switcher */}
      <div className="flex gap-2">
        {CHARGE_TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => switchChargeType(value)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              chargeType === value
                ? 'bg-black text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Month Picker */}
      <MonthPicker debut={filters.debut} fin={filters.fin} onChange={setFilters} />

      {/* Stats Cards */}
      <PaiementStatsCards stats={stats} isLoading={isStatsLoading} />

      {/* Table */}
      <Card className="border shadow-none overflow-hidden">
        <PaiementTable
          table={table}
          isLoading={isLoading}
          isFetching={isFetching}
          pageCount={pageCount}
          emptyMessage="Aucune charge à décaisser"
        />
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
          <span className="font-semibold">{confirmIds.length} charge{confirmIds.length > 1 ? 's' : ''}</span>.
          Cette action est irréversible.
        </p>
      </ConfirmModal>
    </div>
  );
}
