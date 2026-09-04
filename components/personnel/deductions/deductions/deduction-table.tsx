'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { useDeductionTable } from '@/features/personnel/hooks/use-deduction-table';
import { DeductionFilters } from '@/components/personnel/deductions/deductions/deduction-filters';
import { renderDeductionActions } from '@/components/personnel/deductions/deductions/deduction-table-columns';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { PersonnelMobileCard, PersonnelMobileCardList } from '@/components/personnel/shared/personnel-mobile-card';
import EtatErreur from '@/components/commons/EtatErreur';
import { formatCfa, formatDateFr } from '@/lib/date-utils';
import {
  getDeductionStatusClassName,
  getDeductionStatusLabel,
  getDeductionTypeClassName,
  getDeductionTypeLabel,
} from '@/features/personnel/utils/deduction.utils';

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

  const colsCount = deductionTable.getAllColumns().length;
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
      <div className="hidden md:block overflow-x-auto">
        <Table
          isStriped
          bottomContent={
            pagination &&
            pagination.pageCount > 1 && (
              <div className="flex justify-center pt-4 sm:pt-6">
                <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
              </div>
            )
          }
        >
          <TableHeader>
            {deductionTable.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>

          {/* L'echec remplace « Aucune deduction trouvee » : sinon le mois parait vierge de retenues. */}
          <TableBody
            emptyContent={
              enEchec ? <EtatErreur quoi="les déductions" onReessayer={() => refetchDeductions()} enCours={isDeductionFetching} /> : 'Aucune déduction trouvée'
            }
          >
            {isDeductionLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 w-full animate-pulse rounded bg-surface-tertiary" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : enEchec
                ? []
                : deductionTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={isDeductionFetching ? 'opacity-70' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

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
                statut={getDeductionStatusLabel(deduction.status)}
                statutClassName={`${getDeductionStatusClassName(deduction.status)} border-transparent`}
                fields={[
                  {
                    label: 'Type',
                    value: (
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getDeductionTypeClassName(deduction.typeDeduction)}`}>
                        {getDeductionTypeLabel(deduction.typeDeduction)}
                      </span>
                    ),
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
            <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
          </div>
        )}
      </PersonnelMobileCardList>
    </div>
  );
}

