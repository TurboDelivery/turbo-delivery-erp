import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import type { ICreneauDetailLivreur, StatutLivreurDetail } from '../types/historique-creneaux.type';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

const STATUT_BADGE: Record<StatutLivreurDetail, { label: string; className: string }> = {
  OK:      { label: 'OK',      className: 'bg-green-100 text-green-700' },
  REJETE:  { label: 'Rejeté', className: 'bg-red-100 text-red-600' },
  ATTENTE: { label: 'Attente', className: 'bg-gray-100 text-gray-600' },
};

interface Props {
  livreurs: ICreneauDetailLivreur[];
}

export default function HistoriqueCreneauDetailLivreurs({ livreurs }: Props) {
  const totalTickets = livreurs.reduce((s, l) => s + l.tickets, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Détail livreurs</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {livreurs.length} livreurs · {totalTickets} tickets
        </p>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <Table
        aria-label="Détail livreurs"
        removeWrapper
        classNames={{
          base: 'hidden md:block',
          th: 'bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500 py-3 px-4',
          td: 'py-3 px-4 border-b border-gray-100',
          tr: 'hover:bg-gray-50/50 transition-colors',
        }}
      >
        <TableHeader>
          <TableColumn>Turboy</TableColumn>
          <TableColumn>Tickets</TableColumn>
          <TableColumn>Brut</TableColumn>
          <TableColumn>Taux</TableColumn>
          <TableColumn>Net</TableColumn>
          <TableColumn>Statut</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Aucun livreur">
          {livreurs.map((l) => {
            const badge = STATUT_BADGE[l.statut];
            return (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{l.nom}</span>
                    <span className="text-[11px] text-gray-400">{l.code}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700">{l.tickets}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700">{fmt(l.brut)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700">{l.taux}%</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold text-green-600">{fmt(l.net)}</span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {livreurs.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Aucun livreur</p>
        ) : (
          livreurs.map((l) => {
            const badge = STATUT_BADGE[l.statut];
            return (
              <div key={l.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{l.nom}</p>
                    <p className="text-[11px] text-gray-400">{l.code}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Tickets</span>
                  <span className="text-right text-sm text-gray-700">{l.tickets}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Brut</span>
                  <span className="text-right text-sm text-gray-700">{fmt(l.brut)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Taux</span>
                  <span className="text-right text-sm text-gray-700">{l.taux}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Net</span>
                  <span className="text-right text-sm font-semibold text-green-600">{fmt(l.net)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
