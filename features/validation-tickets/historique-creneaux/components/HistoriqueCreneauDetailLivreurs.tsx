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

      <Table
        aria-label="Détail livreurs"
        removeWrapper
        classNames={{
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
        <TableBody emptyContent="Aucun livreur.">
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
    </div>
  );
}
