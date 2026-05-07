'use client';

import { useMemo } from 'react';
import { ColumnDef, getCoreRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

interface Props {
  lignes: IGrillePaiementLigne[];
  checkedIds: Set<string>;
  allChecked: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onRowClick: (ligne: IGrillePaiementLigne) => void;
  totaux: { tickets: number; brut: number; deductions: number; net: number };
  waveManquants: number;
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

export default function GrillePaiementTable({
  lignes,
  checkedIds,
  allChecked,
  onToggle,
  onToggleAll,
  onRowClick,
  totaux,
  waveManquants,
}: Props) {
  const columns = useMemo<ColumnDef<IGrillePaiementLigne>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allChecked}
            onCheckedChange={onToggleAll}
            className="border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={checkedIds.has(row.original.id)}
              onCheckedChange={() => onToggle(row.original.id)}
              className="border-gray-300"
            />
          </div>
        ),
      },
      {
        id: 'turboy',
        header: 'Turboy',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900">{row.original.turboy.nom}</p>
            <p className="text-[11px] text-gray-400">{row.original.turboy.code}</p>
          </div>
        ),
      },
      {
        id: 'tickets',
        header: () => <div className="w-full text-right">Tickets</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium text-gray-700">{row.original.tickets}</div>
        ),
      },
      {
        id: 'brut',
        header: () => <div className="w-full text-right">Brut</div>,
        cell: ({ row }) => (
          <div className="text-right text-gray-700">{formatNumber(row.original.brut)}</div>
        ),
      },
      {
        id: 'taux',
        header: () => <div className="w-full text-right">Taux</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-gray-700">{row.original.taux}%</span>
            {row.original.tauxManuel && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                C
              </span>
            )}
            {row.original.bonus && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                BONUS
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'deductions',
        header: () => <div className="w-full text-right">Déductions</div>,
        cell: ({ row }) => (
          <div className="text-right text-gray-500">
            {row.original.deductions !== 0 ? (
              <span className="text-red-500">−{formatNumber(Math.abs(row.original.deductions))}</span>
            ) : (
              <span className="text-gray-300">–</span>
            )}
          </div>
        ),
      },
      {
        id: 'net',
        header: () => <div className="w-full text-right">Net à payer</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold text-emerald-600">
            {formatNumber(row.original.netAPayer)}
          </div>
        ),
      },
      {
        id: 'wave',
        header: 'N° Wave',
        cell: ({ row }) =>
          row.original.numeroWave ?? (
            <span className="italic text-gray-400">non renseigné</span>
          ),
      },
      {
        id: 'statut',
        header: () => <div className="w-full text-center">Statut</div>,
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.statut === 'OK' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                OK
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                Wave
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'arrow',
        header: '',
        cell: () => <span className="text-gray-300">›</span>,
      },
    ],
    [allChecked, checkedIds, onToggle, onToggleAll],
  );

  const table = useReactTable({
    data: lignes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {waveManquants > 0 && (
        <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {waveManquants} numéro{waveManquants > 1 ? 's' : ''} Wave manquant{waveManquants > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Le Créneau ne peut pas être soumis tant que toutes les lignes ne sont pas validées.
            </p>
          </div>
        </div>
      )}

      <Table
        removeWrapper
        aria-label="Grille de paiement"
        classNames={{
          base: 'mt-8 text-sm',
          th: 'text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-white border-b border-gray-100 px-4 py-3',
          td: 'px-4 py-3 border-b border-gray-50',
          tr: 'transition-colors',
        }}
      >
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="Aucune ligne">
          {[
            ...table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick(row.original)}
                className={cn(
                  'cursor-pointer hover:bg-gray-50',
                  checkedIds.has(row.original.id) && 'bg-gray-50/70',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )),
            <TableRow key="__total__" className="font-bold text-sm">
              <TableCell className="bg-red-600 text-white">{''}</TableCell>
              <TableCell className="bg-red-600 text-white uppercase tracking-wide">Total</TableCell>
              <TableCell className="bg-red-600 text-white">
                <div className="text-right">{totaux.tickets}</div>
              </TableCell>
              <TableCell className="bg-red-600 text-white">
                <div className="text-right">{formatNumber(totaux.brut)}</div>
              </TableCell>
              <TableCell className="bg-red-600 text-white">{''}</TableCell>
              <TableCell className="bg-red-600 text-white">
                <div className="text-right">
                  {totaux.deductions !== 0 ? `−${formatNumber(Math.abs(totaux.deductions))}` : '–'}
                </div>
              </TableCell>
              <TableCell className="bg-red-600 text-white">
                <div className="text-right">{formatNumber(totaux.net)}</div>
              </TableCell>
              <TableCell className="bg-red-600 text-white">{''}</TableCell>
              <TableCell className="bg-red-600 text-white">{''}</TableCell>
              <TableCell className="bg-red-600 text-white">{''}</TableCell>
            </TableRow>,
          ]}
        </TableBody>
      </Table>
    </div>
  );
}
