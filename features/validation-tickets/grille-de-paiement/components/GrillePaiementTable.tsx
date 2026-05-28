'use client';

import { useMemo, useState, useRef } from 'react';
import { ColumnDef, getCoreRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { AlertCircle, CheckCircle2, AlertTriangle, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';
import FichePaieButton from './FichePaieButton';

interface Props {
  lignes: IGrillePaiementLigne[];
  onRowClick: (ligne: IGrillePaiementLigne) => void;
  onUpdateWave: (turboyId: string, value: string) => void;
  onValiderLigne: (ligne: IGrillePaiementLigne) => void;
  waveManquants: number;
  creneauDebut: Date;
  creneauFin: Date;
  readOnly?: boolean;
}

function WaveReadOnlyCell({ ligne }: { ligne: IGrillePaiementLigne }) {
  return ligne.numeroWave ? (
    <span className="text-gray-700">{ligne.numeroWave}</span>
  ) : (
    <span className="italic text-gray-400">non renseigné</span>
  );
}

function WaveCell({ ligne, onUpdateWave }: { ligne: IGrillePaiementLigne; onUpdateWave: (turboyId: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ligne.numeroWave ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    onUpdateWave(ligne.turboy.id, draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(ligne.numeroWave ?? ''); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="N° Wave…"
        
      />
    );
  }

  return (
    <div
      className="group flex items-center gap-1.5 cursor-text"
      onClick={(e) => { e.stopPropagation(); setDraft(ligne.numeroWave ?? ''); setEditing(true); }}
    >
      {ligne.numeroWave ? (
        <span className="text-gray-700">{ligne.numeroWave}</span>
      ) : (
        <span className="italic text-gray-400">non renseigné</span>
      )}
      <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

export default function GrillePaiementTable({
  lignes,
  onRowClick,
  onUpdateWave,
  onValiderLigne,
  waveManquants,
  creneauDebut,
  creneauFin,
  readOnly = false,
}: Props) {
  const columns = useMemo<ColumnDef<IGrillePaiementLigne>[]>(
    () => [
      {
        id: 'turboy',
        header: 'Turboy',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold  text-gray-900">{row.original.turboy.nom}</p>
            <p className="text-[11px] text-gray-400">{row.original.turboy.code}</p>
          </div>
        ),
      },
      {
        id: 'tickets',
        header: () => <div className="w-full text-right">Tickets</div>,
        cell: ({ row }) => <div className="text-right font-medium text-gray-700">{row.original.tickets}</div>,
      },
      {
        id: 'totalFraisLivraison',
        header: () => <div className="w-full text-right">Total realise</div>,
        cell: ({ row }) => <div className="text-right text-gray-700">{formatNumber(row.original.totalFraisLivraison ?? 0)}</div>,
      },
      {
        id: 'taux',
        header: () => <div className="w-full text-right">Taux</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-gray-700">{row.original.taux}%</span>
          </div>
        ),
      },
      {
        id: 'net',
        header: () => <div className="w-full text-right">Commission</div>,
        cell: ({ row }) => <div className="text-right font-semibold text-emerald-600">{formatNumber(row.original.netAPayer)}</div>,
      },
      {
        id: 'wave',
        header: 'N° Wave',
        cell: ({ row }) =>
          readOnly ? <WaveReadOnlyCell ligne={row.original} /> : <WaveCell ligne={row.original} onUpdateWave={onUpdateWave} />,
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
        id: 'action',
        header: '',
        cell: ({ row }) =>
          row.original.flagAttente && !readOnly ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 text-xs" onClick={() => onValiderLigne(row.original)}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Valider
              </Button>
            </div>
          ) : null,
      },
      {
        id: 'fiche',
        header: '',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <FichePaieButton
              turboyId={row.original.turboy.id}
              turboyNom={row.original.turboy.nom}
              creneauDebut={creneauDebut}
              creneauFin={creneauFin}
            />
          </div>
        ),
      },
      {
        id: 'arrow',
        header: '',
        cell: () => <span className="text-gray-300">›</span>,
      },
    ],
    [onUpdateWave, onValiderLigne, creneauDebut, creneauFin, readOnly],
  );

  const table = useReactTable({
    data: lignes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
      {!readOnly && waveManquants > 0 && (
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
          base: ' text-sm',
          th: 'text-[10px] font-semibold uppercase tracking-wider text-gray-600 bg-gray-300 border-b border-gray-100 px-4 py-3',
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
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className={cn(
                'cursor-pointer hover:bg-gray-50',
                row.original.flagAttente && 'bg-amber-50 hover:bg-amber-100',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {/* Total row — désactivé temporairement
        <tfoot>
          <tr className="font-bold text-sm [&>td]:bg-red-600 [&>td]:text-white">
            <td className="px-4 py-3" />
            <td className="px-4 py-3 uppercase tracking-wide">Total</td>
            <td className="px-4 py-3 text-right">{totaux.tickets}</td>
            <td className="px-4 py-3 text-right">{formatNumber(totaux.brut)}</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right">
              {totaux.deductions !== 0 ? `−${formatNumber(Math.abs(totaux.deductions))}` : '–'}
            </td>
            <td className="px-4 py-3 text-right">{formatNumber(totaux.net)}</td>
            <td colSpan={3} />
          </tr>
        </tfoot>
        */}
      </Table>
    </div>
  );
}
