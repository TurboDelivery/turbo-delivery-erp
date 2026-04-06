'use client';

import { Button, Card } from '@heroui/react';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { usePaiementsTable } from '../hooks/use-paiements-table';
import { usePaiementsStats } from '../hooks/use-paiements-stats';
import { useInitierPaiementMutation } from '../queries/paiement.mutation';
import PaiementStatsCards from './paiement-stats-cards';
import PaiementTable from './paiement-table';

export default function PaymentManagementV2() {
  const {
    table,
    isLoading,
    isFetching,
    moisKey,
    monthLabel,
    selectedMonthIndex,
    monthNames,
    goToPreviousMonth,
    goToNextMonth,
    selectMonth,
    selectedIds,
    selectAll,
    deselectAll,
    pageCount,
  } = usePaiementsTable();

  const { stats, isLoading: isStatsLoading } = usePaiementsStats(moisKey);
  const initierMutation = useInitierPaiementMutation();

  const handleInitierPaiement = () => {
    if (selectedIds.size === 0) return;
    initierMutation.mutate({ ids: Array.from(selectedIds), mois: moisKey });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Gestion des Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">Initiez et suivez l&apos;approbation des charges fixes mensuelles</p>
        </div>
        <Button
          color="danger"
          startContent={<Wallet size={16} />}
          onPress={handleInitierPaiement}
          isLoading={initierMutation.isPending}
          isDisabled={selectedIds.size === 0}
        >
          Initier le paiement ({selectedIds.size})
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button isIconOnly size="sm" variant="bordered" radius="full" onPress={goToPreviousMonth}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">{monthLabel}</span>
          <Button isIconOnly size="sm" variant="bordered" radius="full" onPress={goToNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Month Pills */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {monthNames.map((name, index) => (
            <button
              key={name}
              onClick={() => selectMonth(index)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                index === selectedMonthIndex
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <PaiementStatsCards stats={stats} isLoading={isStatsLoading} />

      {/* Bulk Actions */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="bordered" onPress={selectAll}>
          Tout sélectionner
        </Button>
        <Button size="sm" variant="light" className="text-gray-400" onPress={deselectAll} isDisabled={selectedIds.size === 0}>
          Tout désélectionner
        </Button>
      </div>

      {/* Table */}
      <Card className="border shadow-none overflow-hidden">
        <PaiementTable
          table={table}
          isLoading={isLoading}
          isFetching={isFetching}
          pageCount={pageCount}
          emptyMessage="Aucun paiement pour cette période"
        />
      </Card>
    </div>
  );
}
