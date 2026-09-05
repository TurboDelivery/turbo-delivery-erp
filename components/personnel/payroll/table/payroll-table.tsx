'use client';

import { Button, Card, Modal, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import React, { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe } from '@/components/personnel/common/champs-personnel';
import {
  ChipStatutPaie,
  formatDateFr,
  getSalaryStatusTon,
  getStatusTon,
} from '@/components/personnel/payroll/table/payroll-table-columns';
import {
  PersonnelMobileCard,
  PersonnelMobileCardList,
} from '@/components/personnel/shared/personnel-mobile-card';
import { usePayrollTable } from '@/features/personnel/hooks/use-payroll-table';
import { IPayroll } from '@/features/personnel/types/payroll.types';

/** Les libellés étaient écrits sans accents — « Fevrier », « Aout », « Decembre ». */
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

const formatCfa = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', {
    currency: 'XOF',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount || 0);

function PayrollTable() {
  const {
    filters,
    handleMonthFilterChange,
    handlePayPayroll,
    handleYearFilterChange,
    isPayingPayroll,
    isPayrollError,
    isPayrollFetching,
    isPayrollLoading,
    payrollTable,
    refetchPayrolls,
  } = usePayrollTable();
  const [selectedPayroll, setSelectedPayroll] = useState<IPayroll | null>(null);
  // L'echec ne prend la place des lignes que s'il n'y a rien a montrer : un rafraichissement
  // rate laisse la paie deja chargee en place.
  const enEchec = isPayrollError && payrollTable.getRowModel().rows.length === 0;
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const annees = Array.from({ length: Math.max(currentYear - startYear + 1, 1) }, (_, i) => ({
    label: String(startYear + i),
    value: String(startYear + i),
  }));

  const handleConfirmPay = () => {
    if (selectedPayroll) {
      handlePayPayroll(selectedPayroll);
      setSelectedPayroll(null);
    }
  };

  const enTetes = payrollTable.getFlatHeaders();

  /**
   * Le bouton « Payer », monté une fois.
   *
   * <p>C'était un `<button>` nu portant TRENTE classes recopiées à la main pour imiter un
   * bouton — jusqu'aux états `disabled:` et à l'anneau de focus —, dupliqué à l'identique
   * dans le tableau et dans la carte tactile.</p>
   */
  const boutonPayer = (payroll: IPayroll, pleineLargeur = false) => {
    const isPaid = payroll.salary_status === 'PAID';
    return (
      <Button
        className={pleineLargeur ? 'w-full' : undefined}
        isDisabled={isPaid || isPayingPayroll}
        onPress={() => setSelectedPayroll(payroll)}
        size="sm"
        variant="primary"
      >
        {isPaid ? 'Payé' : 'Payer'}
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <div className="w-full max-w-xs">
          <ChampListe
            label="Année"
            onChange={(v) => handleYearFilterChange(Number(v))}
            options={annees}
            placeholder="Sélectionner une année"
            valeur={String(filters.year)}
          />
        </div>
        <div className="w-full max-w-xs">
          <ChampListe
            label="Mois"
            onChange={(v) => handleMonthFilterChange(Number(v))}
            options={MOIS}
            placeholder="Sélectionner un mois"
            valeur={String(filters.month)}
          />
        </div>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Bulletins de paie" className="min-w-[72rem]">
                <Table.Header>
                  {enTetes.map((header) => (
                    <Table.Column
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader={header.id === 'name'}
                      key={header.id}
                    >
                      {({ sortDirection }) =>
                        header.column.getCanSort() ? (
                          <Table.SortableColumnHeader sortDirection={sortDirection}>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.SortableColumnHeader>
                        ) : (
                          <>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </>
                        )
                      }
                    </Table.Column>
                  ))}
                </Table.Header>

                {/* L'echec remplace « Aucun paiement trouve », qui se lirait comme un mois sans paie. */}
                <Table.Body
                  renderEmptyState={() =>
                    isPayrollLoading ? null : enEchec ? (
                      <div className="py-6">
                        <EtatErreur
                          enCours={isPayrollFetching}
                          onReessayer={() => refetchPayrolls()}
                          quoi="les paiements"
                        />
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucun paiement trouvé</p>
                    )
                  }
                >
                  {/* Le squelette compte ses cellules sur les MEMES en-tetes que les lignes. */}
                  {isPayrollLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {enTetes.map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isPayrollLoading || enEchec ? [] : payrollTable.getRowModel().rows).map(
                    (row) => (
                      <Table.Row id={row.id} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell
                            className={isPayrollFetching ? 'opacity-70' : undefined}
                            key={cell.id}
                          >
                            {cell.column.id === 'actions'
                              ? boutonPayer(row.original)
                              : flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ),
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <PersonnelMobileCardList>
        {isPayrollLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div className="h-48 animate-pulse rounded-xl bg-surface-secondary" key={`m-skel-${i}`} />
          ))
        ) : enEchec ? (
          <EtatErreur
            enCours={isPayrollFetching}
            onReessayer={() => refetchPayrolls()}
            quoi="les paiements"
          />
        ) : payrollTable.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun paiement trouvé</p>
        ) : (
          payrollTable.getRowModel().rows.map((row) => {
            const payroll = row.original;
            const isPaid = payroll.salary_status === 'PAID';
            return (
              <PersonnelMobileCard
                actions={boutonPayer(payroll, true)}
                fields={[
                  { label: 'Poste', value: payroll.position || '-' },
                  { label: 'Département', value: payroll.department || '-' },
                  { label: 'Salaire brut', value: formatCfa(payroll.salaryBrut) },
                  {
                    label: 'Déductions en attente',
                    value: formatCfa(payroll.totalDeductionsPending),
                  },
                  { label: 'Déductions payées', value: formatCfa(payroll.totalDeductionsPaid) },
                  {
                    label: 'Net à payer',
                    value: <span className="font-semibold">{formatCfa(payroll.netToPay)}</span>,
                  },
                  {
                    label: 'Statut',
                    value: (
                      <ChipStatutPaie
                        statut={payroll.statut}
                        ton={getStatusTon(payroll.statut)}
                      />
                    ),
                  },
                  { label: 'Date entrée', value: formatDateFr(payroll.entryDate) },
                  {
                    label: 'Dernière maj',
                    value: formatDateFr(payroll.updatedAt, 'dd MMM yyyy HH:mm'),
                  },
                ]}
                key={payroll.id}
                statut={
                  <ChipStatutPaie
                    statut={isPaid ? 'Payé' : 'Non payé'}
                    ton={getSalaryStatusTon(payroll.salary_status)}
                  />
                }
                subtitle={payroll.email || '-'}
                title={payroll.name || '-'}
              />
            );
          })
        )}
      </PersonnelMobileCardList>

      <Modal
        isOpen={Boolean(selectedPayroll)}
        onOpenChange={(open) => !open && setSelectedPayroll(null)}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Confirmer le paiement</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-2">
                <p className="text-sm text-muted">
                  Êtes-vous sûr de vouloir payer{' '}
                  <span className="font-semibold text-foreground">{selectedPayroll?.name}</span> ?
                </p>
                <div className="flex justify-between rounded-lg bg-surface-secondary p-3">
                  <span className="text-sm text-muted">Montant net</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCfa(selectedPayroll?.netToPay || 0)}
                  </span>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setSelectedPayroll(null)} variant="ghost">
                  Annuler
                </Button>
                <Button isPending={isPayingPayroll} onPress={handleConfirmPay} variant="primary">
                  Confirmer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

export default PayrollTable;
