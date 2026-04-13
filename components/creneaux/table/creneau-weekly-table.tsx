'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Progress, Avatar } from '@heroui/react';
import { ICreneauTurboy, CreneauStatutJour, ICreneauJour } from '@/features/creneaux/types/creneau.types';
import { getStatutDotColor } from '@/features/creneaux/utils/statut.utils';
import { getAssiduitProgressColor } from '@/features/creneaux/utils/assiduite.utils';
import { createUrlFile } from '@/utils/createUrlFile';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOURS_INDEX = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

interface CreneauWeeklyTableProps {
  data: ICreneauTurboy[];
  jourDates?: Record<string, string>;
  isLoading?: boolean;
  onAbsenceClick?: (turboy: ICreneauTurboy, jour: ICreneauJour) => void;
  pagination?: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
}

function StatutDot({ statut }: { statut: CreneauStatutJour }) {
  return <span className={`inline-block size-3 rounded-full ${getStatutDotColor(statut)}`} />;
}

export function CreneauWeeklyTable({ data, jourDates = {}, isLoading, pagination, onAbsenceClick }: CreneauWeeklyTableProps) {
  const router = useRouter();
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
      header: () => {
        const dateStr = jourDates[JOURS_INDEX[idx]];
        const dayNum = dateStr ? new Date(dateStr).getDate() : null;
        const isHighlight = JOURS_INDEX[idx] === 'JEUDI' || JOURS_INDEX[idx] === 'SAMEDI';
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className={`font-medium ${isHighlight ? 'text-orange-500 italic' : ''}`}>{jour}</span>
            {dayNum && <span className={`text-xs ${isHighlight ? 'text-orange-500 font-semibold' : 'text-default-400'}`}>{dayNum}</span>}
            {dateStr ? (
              <span
                role="button"
                tabIndex={0}
                className="text-[10px] text-primary hover:underline cursor-pointer"
                onClick={(e) => { e.stopPropagation(); router.push(`/delivery-men/creneaux/jour/${dateStr}`); }}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/delivery-men/creneaux/jour/${dateStr}`); }}
              >
                Voir details
              </span>
            ) : (
              <span className="text-[10px] text-primary">Voir details</span>
            )}
          </div>
        );
      },
      cell: ({ row }: { row: { original: ICreneauTurboy } }) => {
        const jourData = row.original.jours?.find(
          (j) => j.jour.toUpperCase() === JOURS_INDEX[idx],
        );
        const statut = jourData?.statut ?? CreneauStatutJour.NON_INSCRIT;
        const isAbsent = statut === CreneauStatutJour.ABSENT && !!onAbsenceClick && !!jourData;
        return (
          <div
            className={`flex justify-center ${isAbsent ? 'cursor-pointer' : ''}`}
            onClick={isAbsent ? () => onAbsenceClick(row.original, jourData!) : undefined}
            title={isAbsent ? 'Cliquer pour gérer l\'absence' : undefined}
          >
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
  ], [jourDates, onAbsenceClick, router]);

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
