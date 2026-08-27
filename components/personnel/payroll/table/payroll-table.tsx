'use client';

import React, { useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePayrollTable } from '@/features/personnel/hooks/use-payroll-table';
import { IPayroll } from '@/features/personnel/types/payroll.types';
import { PersonnelMobileCard, PersonnelMobileCardList } from '@/components/personnel/shared/personnel-mobile-card';
import { getSalaryStatusClassName, getStatusClassName, formatDateFr } from '@/components/personnel/payroll/table/payroll-table-columns';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Fevrier' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Aout' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Decembre' },
];

function PayrollTable() {
  const { payrollTable, isPayrollLoading, isPayrollFetching, filters, handleMonthFilterChange, handleYearFilterChange, handlePayPayroll, isPayingPayroll } = usePayrollTable();
  const [selectedPayroll, setSelectedPayroll] = useState<IPayroll | null>(null);
  const colsCount = payrollTable.getAllColumns().length;
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const yearOptions = Array.from({ length: Math.max(currentYear - startYear + 1, 1) }, (_, index) => startYear + index);

  const handlePayClick = (payroll: IPayroll) => {
    setSelectedPayroll(payroll);
  };

  const handleConfirmPay = () => {
    if (selectedPayroll) {
      handlePayPayroll(selectedPayroll);
      setSelectedPayroll(null);
    }
  };

  const formatCfa = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="payroll-year">Année</Label>
          <Select value={String(filters.year)} onValueChange={(value) => handleYearFilterChange(Number(value))}>
            <SelectTrigger id="payroll-year">
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="payroll-month">Mois</Label>
          <Select value={String(filters.month)} onValueChange={(value) => handleMonthFilterChange(Number(value))}>
            <SelectTrigger id="payroll-month">
              <SelectValue placeholder="Sélectionner un mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block overflow-x-auto">
        <Table isStriped>
          <TableHeader>
            {payrollTable.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>

          <TableBody emptyContent="Aucun paiement trouvé">
            {isPayrollLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : payrollTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={isPayrollFetching ? 'opacity-70' : ''}>
                    {row.getVisibleCells().map((cell) => {
                      if (cell.column.id === 'actions') {
                        return (
                          <TableCell key={cell.id}>
                            {flexRender(
                              () => (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handlePayClick(row.original)}
                                    disabled={row.original.salary_status === 'PAID' || isPayingPayroll}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-600"
                                  >
                                    {row.original.salary_status === 'PAID' ? 'Payé' : 'Payer'}
                                  </button>
                                </div>
                              ),
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      }

                      return <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
                    })}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <PersonnelMobileCardList>
        {isPayrollLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={`m-skel-${i}`} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)
        ) : payrollTable.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun paiement trouvé</p>
        ) : (
          payrollTable.getRowModel().rows.map((row) => {
            const payroll = row.original;
            const isPaid = payroll.salary_status === 'PAID';
            return (
              <PersonnelMobileCard
                key={payroll.id}
                title={payroll.name || '-'}
                subtitle={payroll.email || '-'}
                statut={isPaid ? 'Payé' : 'Non payé'}
                statutClassName={getSalaryStatusClassName(payroll.salary_status)}
                fields={[
                  { label: 'Poste', value: payroll.position || '-' },
                  { label: 'Département', value: payroll.department || '-' },
                  { label: 'Salaire brut', value: formatCfa(payroll.salaryBrut) },
                  { label: 'Déductions en attente', value: <span className="text-amber-700">{formatCfa(payroll.totalDeductionsPending)}</span> },
                  { label: 'Déductions payées', value: <span className="text-green-700">{formatCfa(payroll.totalDeductionsPaid)}</span> },
                  { label: 'Net a payer', value: <span className="font-semibold">{formatCfa(payroll.netToPay)}</span> },
                  {
                    label: 'Statut',
                    value: (
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusClassName(payroll.statut)}`}>
                        {payroll.statut || '-'}
                      </span>
                    ),
                  },
                  { label: 'Date entrée', value: formatDateFr(payroll.entryDate) },
                  { label: 'Dernière maj', value: formatDateFr(payroll.updatedAt, 'dd MMM yyyy HH:mm') },
                ]}
                actions={
                  <button
                    onClick={() => handlePayClick(payroll)}
                    disabled={isPaid || isPayingPayroll}
                    className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-600"
                  >
                    {isPaid ? 'Payé' : 'Payer'}
                  </button>
                }
              />
            );
          })
        )}
      </PersonnelMobileCardList>

      <AlertDialog open={Boolean(selectedPayroll)} onOpenChange={(open) => !open && setSelectedPayroll(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Êtes-vous sûr de vouloir payer <span className="font-semibold">{selectedPayroll?.name}</span> ?
              </div>
              <div className="space-y-1 rounded-lg bg-gray-100 p-3 dark:bg-gray-900">
                <div className="flex justify-between">
                  <span className="text-sm">Montant net:</span>
                  <span className="font-semibold">{formatCfa(selectedPayroll?.netToPay || 0)}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPay} disabled={isPayingPayroll}>
              {isPayingPayroll ? 'Traitement...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PayrollTable;