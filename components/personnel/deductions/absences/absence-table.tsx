'use client';

import React, { useState } from 'react';
import { subMonths } from 'date-fns';
import { flexRender } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { useAbsenceTable } from '@/features/personnel/hooks/use-absence-table';
import { IAbsence } from '@/features/personnel/types/absence.types';
import { AbsenceFilters } from './absence-filters';
import AbsenceModal from '@/components/personnel/deductions/modals/absence-modal';
import {
  renderAbsenceActions,
  getAbsenceDurationInDays,
  getAbsenceTypeLabel,
  getAbsenceTypeClassName,
} from './absence-table-columns';
import { PersonnelMobileCard, PersonnelMobileCardList } from '@/components/personnel/shared/personnel-mobile-card';
import { formatDateFr } from '@/lib/date-utils';

interface AbsenceTableProps {
  showFilters?: boolean;
}

export function AbsenceTable({ showFilters = true }: AbsenceTableProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<IAbsence | null>(null);

  const handleOpenEditModal = (absence: IAbsence) => {
    setSelectedAbsence(absence);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAbsence(null);
  };

  const { absenceTable, isAbsenceLoading, isAbsenceFetching, pagination, filters, setFilters, handleTypeFilterChange, handleEmployeeFilterChange, handlePeriodeFilterChange } =
    useAbsenceTable({ onEditAbsence: handleOpenEditModal });

  const colsCount = absenceTable.getAllColumns().length;

  const handleResetFilters = () => {
    setFilters({
      type: '',
      employeeId: '',
      periodeDebut: subMonths(new Date(), 1),
      periodeFin: new Date(),
      page: 0,
    });
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <AbsenceFilters
          filters={filters}
          handleTypeFilterChange={handleTypeFilterChange}
          handleEmployeeFilterChange={handleEmployeeFilterChange}
          handlePeriodeFilterChange={handlePeriodeFilterChange}
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
            {absenceTable.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>

          <TableBody emptyContent="Aucune absence trouvee">
            {isAbsenceLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : absenceTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={isAbsenceFetching ? 'opacity-70' : ''}>
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
        {isAbsenceLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={`m-skel-${i}`} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)
        ) : absenceTable.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucune absence trouvee</p>
        ) : (
          absenceTable.getRowModel().rows.map((row) => {
            const absence = row.original;
            const typeLabel = getAbsenceTypeLabel(absence.type);
            return (
              <PersonnelMobileCard
                key={row.id}
                title={absence.employee?.name ?? '-'}
                subtitle={absence.employee?.email ?? '-'}
                statut={typeLabel}
                statutClassName={`${getAbsenceTypeClassName(typeLabel)} border-transparent`}
                fields={[
                  { label: "Période d'absence", value: `${formatDateFr(absence.dateDebut)} - ${formatDateFr(absence.dateFin)}` },
                  { label: 'Durée', value: getAbsenceDurationInDays(absence.dateDebut, absence.dateFin) },
                  { label: 'Motif', value: absence.motif?.trim() || '-' },
                ]}
                actions={renderAbsenceActions(absence, handleOpenEditModal)}
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

      <AbsenceModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} absence={selectedAbsence} />
    </div>
  );
}
