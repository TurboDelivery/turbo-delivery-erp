'use client';

import { useMemo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Progress, Avatar, Pagination } from '@heroui/react';
import { ICreneauTurboy, CreneauStatutJour } from '@/features/creneaux/types/creneau.types';
import { getStatutDotColor } from '@/features/creneaux/utils/statut.utils';
import { getAssiduitProgressColor } from '@/features/creneaux/utils/assiduite.utils';
import { createUrlFile } from '@/utils/createUrlFile';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOURS_INDEX = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

interface CreneauWeeklyTableProps {
  data: ICreneauTurboy[];
  jourDates?: Record<string, string>;
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
}

function StatutDot({ statut }: { statut: CreneauStatutJour }) {
  return <span className={`inline-block size-3 rounded-full ${getStatutDotColor(statut)}`} />;
}

export function CreneauWeeklyTable({ data, jourDates = {}, isLoading, pagination }: CreneauWeeklyTableProps) {
  const columns = useMemo<ColumnDef<ICreneauTurboy>[]>(() => [
    {
      id: 'turboy',
      header: 'Turboy',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar
            size="sm"
            src={row.original.avatar ? createUrlFile(row.original.avatar, 'backend') : undefined}
            name={row.original.nomComplet}
            className="shrink-0"
          />
          <span className="text-sm font-medium">{row.original.nomComplet}</span>
        </div>
      ),
    },
    ...JOURS.map((jour, idx) => ({
      id: `jour_${idx}`,
      header: () => (
        <div className="flex flex-col items-center">
          <span className="font-medium">{jour}</span>
          {jourDates[JOURS_INDEX[idx]] && (
            <span className="text-xs text-default-400">{new Date(jourDates[JOURS_INDEX[idx]]).getDate()}</span>
          )}
        </div>
      ),
      cell: ({ row }: { row: { original: ICreneauTurboy } }) => {
        const jourData = row.original.jours?.find(
          (j) => j.jour.toUpperCase() === JOURS_INDEX[idx],
        );
        const statut = jourData?.statut ?? CreneauStatutJour.NON_INSCRIT;
        return (
          <div className="flex justify-center">
            <StatutDot statut={statut} />
          </div>
        );
      },
    })),
    {
      id: 'assiduite',
      header: 'Assiduite',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress
            size="sm"
            value={row.original.assiduite}
            color={getAssiduitProgressColor(row.original.assiduite)}
            className="max-w-24"
            aria-label="Assiduite"
          />
          <span className="text-sm font-medium">{row.original.assiduite}%</span>
        </div>
      ),
    },
  ], [jourDates]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.pageCount ?? 0,
  });

  const colsCount = table.getAllColumns().length;

  return (
    <Table
      isStriped
      aria-label="Tableau de presence hebdomadaire"
      bottomContent={
        pagination && pagination.pageCount > 1 && (
          <div className="flex justify-center py-4">
            <Pagination
              total={pagination.pageCount}
              page={pagination.page + 1}
              onChange={pagination.onPageChange}
              color="primary"
              showControls
            />
          </div>
        )
      }
    >
      <TableHeader>
        {table.getFlatHeaders().map((header) => (
          <TableColumn key={header.id} className="text-center">
            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="Aucun turboy trouve">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {Array.from({ length: colsCount }).map((_, j) => (
                  <TableCell key={`skeleton-cell-${j}`}>
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
