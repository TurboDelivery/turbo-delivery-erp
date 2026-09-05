'use client';

import { Card, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import {
  ChipStatutDeduction,
  ChipTypeDeduction,
} from '@/components/personnel/deductions/deductions/chips-deduction';
import { DeductionFilters } from '@/components/personnel/deductions/deductions/deduction-filters';
import { renderDeductionActions } from '@/components/personnel/deductions/deductions/deduction-table-columns';
import {
  PersonnelMobileCard,
  PersonnelMobileCardList,
} from '@/components/personnel/shared/personnel-mobile-card';
import { useDeductionTable } from '@/features/personnel/hooks/use-deduction-table';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { formatCfa, formatDateFr } from '@/lib/date-utils';

interface DeductionTableProps {
  showFilters?: boolean;
  onEditDeduction?: (deduction: IDeduction) => void;
  onCancelDeduction?: (deduction: IDeduction) => void;
  onDeleteDeduction?: (deduction: IDeduction) => void;
}

export function DeductionTable({ showFilters = true, onEditDeduction, onCancelDeduction, onDeleteDeduction }: DeductionTableProps) {
  const {
    deductionTable,
    isDeductionLoading,
    isDeductionFetching,
    isDeductionError,
    refetchDeductions,
    pagination,
    filters,
    setFilters,
    handleEmployeeFilterChange,
    handleYearFilterChange,
    handleMonthFilterChange,
  } = useDeductionTable({ onEditDeduction, onCancelDeduction, onDeleteDeduction });

  const enTetes = deductionTable.getFlatHeaders();
  // L'echec ne prend la place des lignes que s'il n'y a rien a montrer : un rafraichissement
  // rate laisse les deductions deja chargees en place.
  const enEchec = isDeductionError && deductionTable.getRowModel().rows.length === 0;

  const handleResetFilters = () => {
    const now = new Date();

    setFilters({
      employeeId: '',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <DeductionFilters
          filters={filters}
          handleEmployeeFilterChange={handleEmployeeFilterChange}
          handleYearFilterChange={handleYearFilterChange}
          handleMonthFilterChange={handleMonthFilterChange}
          onReset={handleResetFilters}
        />
      )}

      {/* Tableau — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Déductions" className="min-w-[60rem]">
                <Table.Header>
                  {enTetes.map((header) => (
                    <Table.Column
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader={header.id === 'employee'}
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

                {/* L'echec remplace « Aucune deduction trouvee » : sinon le mois parait
                    vierge de retenues. */}
                <Table.Body
                  renderEmptyState={() =>
                    isDeductionLoading ? null : enEchec ? (
                      <div className="py-6">
                        <EtatErreur
                          enCours={isDeductionFetching}
                          onReessayer={() => refetchDeductions()}
                          quoi="les déductions"
                        />
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucune déduction trouvée</p>
                    )
                  }
                >
                  {/* Le squelette compte ses cellules sur les MEMES en-tetes que les lignes
                      reelles : « Cell count must match column count » emporte la page. */}
                  {isDeductionLoading
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

                  {(isDeductionLoading || enEchec ? [] : deductionTable.getRowModel().rows).map(
                    (row) => (
                      <Table.Row id={row.id} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell
                            className={isDeductionFetching ? 'opacity-70' : undefined}
                            key={cell.id}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ),
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {pagination && pagination.pageCount > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau
                  onPage={(p) => pagination.handlePageChange(p)}
                  page={pagination.page + 1}
                  total={pagination.pageCount}
                />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <PersonnelMobileCardList>
        {isDeductionLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={`m-skel-${i}`} className="h-44 rounded-xl bg-surface-secondary animate-pulse" />)
        ) : enEchec ? (
          <EtatErreur quoi="les déductions" onReessayer={() => refetchDeductions()} enCours={isDeductionFetching} />
        ) : deductionTable.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">Aucune déduction trouvée</p>
        ) : (
          deductionTable.getRowModel().rows.map((row) => {
            const deduction = row.original;
            return (
              <PersonnelMobileCard
                key={row.id}
                title={deduction.employee?.name ?? '-'}
                subtitle={deduction.employee?.email ?? '-'}
                statut={<ChipStatutDeduction statut={deduction.status} />}
                fields={[
                  {
                    label: 'Type',
                    value: <ChipTypeDeduction type={deduction.typeDeduction} />,
                  },
                  { label: 'Montant', value: <span className="font-medium">{formatCfa(deduction.amount)}</span> },
                  { label: 'Date déduction', value: formatDateFr(deduction.deductionDate) },
                  { label: 'Mois de paie', value: formatDateFr(deduction.payrollMonth, 'MMM yyyy') },
                  { label: 'Description', value: deduction.description?.trim() || '-' },
                ]}
                actions={renderDeductionActions(deduction, { onEditDeduction, onCancelDeduction, onDeleteDeduction })}
              />
            );
          })
        )}
        {pagination && pagination.pageCount > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau
              onPage={(p) => pagination.handlePageChange(p)}
              page={pagination.page + 1}
              total={pagination.pageCount}
            />
          </div>
        )}
      </PersonnelMobileCardList>
    </div>
  );
}

