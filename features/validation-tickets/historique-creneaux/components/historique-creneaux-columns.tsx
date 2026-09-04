import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ColumnDef } from '@tanstack/react-table';
import type { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { getLotStatutConfig } from '../utils/lot-statut.utils';
import CreneauActifToggleCell from './CreneauActifToggleCell';

export function fmtDate(iso: string | null) {
  if (!iso) return '';
  try { return format(parseISO(iso), 'd MMM yyyy', { locale: fr }); } catch { return iso; }
}

export const historiqueCreneauxColumns: ColumnDef<ICreneauActifVm>[] = [
  {
    accessorKey: 'label',
    header: 'Créneau',
    cell: ({ row }) => (
      <span className="font-semibold text-foreground text-sm whitespace-nowrap">{row.original.label}</span>
    ),
  },
  {
    id: 'periode',
    header: 'Période',
    cell: ({ row }) => (
      <span className="text-sm text-muted whitespace-nowrap">
        {fmtDate(row.original.dateDebut)} → {fmtDate(row.original.dateFin)}
      </span>
    ),
  },
  {
    accessorKey: 'nbLivreurs',
    header: 'Livreurs',
    cell: ({ row }) => <span className="text-sm text-foreground">{row.original.nbLivreurs}</span>,
  },
  {
    accessorKey: 'totalTickets',
    header: 'Tickets',
    cell: ({ row }) => <span className="text-sm text-foreground">{row.original.totalTickets}</span>,
  },
  {
    accessorKey: 'nbTicketsPending',
    header: 'En attente',
    cell: ({ row }) => (
      <span className={`text-sm font-medium ${row.original.nbTicketsPending > 0 ? 'text-amber-600' : 'text-muted'}`}>
        {row.original.nbTicketsPending}
      </span>
    ),
  },
  {
    accessorKey: 'totalNet',
    header: 'Net (FCFA)',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
        {formatCFA(row.original.totalNet)}
      </span>
    ),
  },
  {
    id: 'soumisLe',
    header: 'Soumis le',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-foreground whitespace-nowrap">{fmtDate(row.original.soumisAt)}</span>
        {row.original.soumisParNom && (
          <span className="text-xs text-muted">par {row.original.soumisParNom}</span>
        )}
      </div>
    ),
  },
  {
    id: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const config = getLotStatutConfig(row.original.lotStatut);
      return (
        <div className="flex flex-col gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold w-fit ${config.className}`}>
            {config.label}
          </span>
          {row.original.commentaireRejet && (
            <p className="text-xs text-muted max-w-[220px] line-clamp-2">{row.original.commentaireRejet}</p>
          )}
        </div>
      );
    },
  },
  {
    // V59 (2026-05-29) — Bascule de visibilité (drapeau actif). Remplace
    // l'ancienne modale "Gérer les créneaux" de la grille de paiement.
    id: 'actif',
    header: 'Visible',
    cell: ({ row }) => <CreneauActifToggleCell creneau={row.original} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link
        href={`/validation-tickets/historique-creneaux/${row.original.id}`}
        className="text-sm font-medium text-red-500 hover:text-red-600 whitespace-nowrap"
      >
        Détail &rsaquo;
      </Link>
    ),
  },
];
