'use client';

import { Download } from 'lucide-react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import useHistoriqueCreneaux from '../hooks/use-historique-creneaux';
import HistoriqueCreneauxStats from './HistoriqueCreneauxStats';
import { historiqueCreneauxColumns, fmtDate } from './historique-creneaux-columns';
import { getLotStatutConfig } from '../utils/lot-statut.utils';
import CreneauActifToggleCell from './CreneauActifToggleCell';
import type { StatutFilter } from '../hooks/use-historique-creneaux';

const STATUT_FILTERS: { value: StatutFilter; label: string }[] = [
  { value: 'tous',              label: 'Tous' },
  { value: 'EN_ATTENTE',        label: 'En attente' },
  { value: 'CALCUL_EN_COURS',   label: 'En préparation' },
  { value: 'SOUMIS_DGA',        label: 'Soumis DGA' },
  { value: 'VALIDE_DGA',        label: 'Visé DGA' },
  { value: 'APPROUVE_DG',       label: 'Approuvé PDG' },
  { value: 'PAIEMENT_EN_COURS', label: 'Paiement en cours' },
  { value: 'SOLDE',             label: 'Soldé' },
  { value: 'REJETE',            label: 'Rejeté' },
];

export default function HistoriqueCreneauxContent() {
  const { filtered, stats, statutFilter, setStatutFilter, exportXlsx, isLoading } =
    useHistoriqueCreneaux();

  const table = useReactTable({
    data: filtered,
    columns: historiqueCreneauxColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-red-500">Historique des créneaux</h1>
        <Button
          variant="bordered"
          color="primary"
          startContent={<Download size={16} />}
          isDisabled={filtered.length === 0}
          onPress={exportXlsx}
        >
          Exporter Excel
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <HistoriqueCreneauxStats stats={stats} />
      )}

      {/* Search + Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-500 mr-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
            </svg>
            Statut :
          </span>
          {STATUT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatutFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statutFilter === f.value
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — desktop uniquement (≥ md) */}
      <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table
          aria-label="Historique des créneaux"
          removeWrapper
          classNames={{
            th: 'bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500 py-3 px-4',
            td: 'py-4 px-4 border-b border-gray-100',
            tr: 'hover:bg-gray-50/60 transition-colors',
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={
              isLoading ? ' ' : <span className="text-sm text-gray-400">Aucun créneau trouvé.</span>
            }
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    {historiqueCreneauxColumns.map((col) => (
                      <TableCell key={String(col.id ?? i)}>
                        <div className="h-4 animate-pulse rounded bg-gray-100" />
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
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucun créneau trouvé.</p>
        ) : (
          filtered.map((creneau) => {
            const config = getLotStatutConfig(creneau.lotStatut);
            return (
              <div
                key={creneau.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{creneau.label}</p>
                    <p className="text-xs text-gray-500">
                      {fmtDate(creneau.dateDebut)} → {fmtDate(creneau.dateFin)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
                  >
                    {config.label}
                  </span>
                </div>

                {creneau.commentaireRejet && (
                  <p className="line-clamp-2 text-xs text-gray-500">{creneau.commentaireRejet}</p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Livreurs</span>
                  <span className="text-right text-sm text-gray-700">{creneau.nbLivreurs}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Tickets</span>
                  <span className="text-right text-sm text-gray-700">{creneau.totalTickets}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">En attente</span>
                  <span
                    className={`text-right text-sm font-medium ${creneau.nbTicketsPending > 0 ? 'text-amber-600' : 'text-gray-400'}`}
                  >
                    {creneau.nbTicketsPending}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Net (FCFA)</span>
                  <span className="text-right text-sm font-semibold text-gray-900">{formatCFA(creneau.totalNet)}</span>
                </div>
                {creneau.soumisAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-xs text-gray-400">Soumis le</span>
                    <span className="text-right text-sm text-gray-700">
                      {fmtDate(creneau.soumisAt)}
                      {creneau.soumisParNom && (
                        <span className="text-gray-400"> · {creneau.soumisParNom}</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Visible</span>
                  <CreneauActifToggleCell creneau={creneau} />
                </div>

                <div className="pt-1">
                  <Link
                    href={`/validation-tickets/historique-creneaux/${creneau.id}`}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    Voir le détail &rsaquo;
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
