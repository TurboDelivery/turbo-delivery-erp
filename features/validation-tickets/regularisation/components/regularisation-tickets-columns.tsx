import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Loader2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';
import { formatMontant } from '@/utils/format.utils';

export interface RegularisationTicketsColumnMeta {
  onApprove: (id: string) => void;
  onReject: (ticket: BonLivraisonTerminee) => void;
  onAuthentifier: (id: string) => void;
  approvingId: string | null;
  isApproving: boolean;
  authenticatedIds: Set<string>;
}

/** Libellé + style du badge par statut (dupliqué localement — voir ticket-table-columns). */
const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  [StatutControle.PENDING]: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  [StatutControle.TARDIF]: { label: 'Tardif', className: 'bg-orange-100 text-orange-700' },
  [StatutControle.AUTHENTIFIE]: { label: 'Authentifié', className: 'bg-blue-100 text-blue-700' },
  [StatutControle.V1_VALIDE]: { label: 'V1 Validé', className: 'bg-teal-100 text-teal-700' },
  [StatutControle.V2_VALIDE]: { label: 'V2 Validé', className: 'bg-green-100 text-green-700' },
  [StatutControle.REJETE_FRAUDE]: { label: 'Rejeté (Fraude)', className: 'bg-red-100 text-red-700' },
};

/**
 * Config (libellé + classes du badge) du statut effectif d'un ticket. Tient
 * compte de l'authentification optimiste (PENDING + id authentifié → AUTHENTIFIE).
 * Partagé entre la colonne « Statut » du tableau et la carte mobile.
 */
export function getRegularisationStatutConfig(
  ticket: BonLivraisonTerminee,
  authenticatedIds: Set<string>,
) {
  const rawStatut = ticket.statutControle ?? ticket.statut;
  const statut =
    rawStatut === StatutControle.PENDING && authenticatedIds.has(ticket.commandeId)
      ? StatutControle.AUTHENTIFIE
      : rawStatut;
  return STATUT_CONFIG[statut] ?? { label: statut, className: 'bg-gray-100 text-gray-700' };
}

/**
 * Actions disponibles pour un ticket selon son statut (authentifier / approuver
 * / rejeter / aucune). Partagé entre la cellule « Actions » du tableau et la
 * carte mobile (zéro divergence de logique). {@code fullWidth} étire les boutons
 * pour l'affichage carte mobile.
 */
export function renderRegularisationActions(
  ticket: BonLivraisonTerminee,
  meta: RegularisationTicketsColumnMeta,
  fullWidth = false,
) {
  const statut = ticket.statutControle ?? ticket.statut;

  // PENDING → authentification (déjà fait = aucune action).
  if (statut === StatutControle.PENDING) {
    if (meta.authenticatedIds.has(ticket.commandeId)) {
      return (
        <div className="flex items-center justify-end gap-1 text-xs font-medium text-blue-600">
          <BadgeCheck className="h-3.5 w-3.5" />
          Authentifié
        </div>
      );
    }
    return (
      <div className={`flex items-center ${fullWidth ? '' : 'justify-end'}`}>
        <Button
          size="sm"
          onClick={() => meta.onAuthentifier(ticket.commandeId)}
          className={`h-7 gap-1.5 bg-emerald-500 text-xs text-white hover:bg-emerald-600 ${fullWidth ? 'w-full' : ''}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Authentifier
        </Button>
      </div>
    );
  }

  // TARDIF → approuver (retard) ou rejeter (fraude).
  if (statut === StatutControle.TARDIF) {
    const isApprovingThis = meta.isApproving && meta.approvingId === ticket.commandeId;
    return (
      <div className={`flex items-center gap-2 ${fullWidth ? '' : 'justify-end'}`}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => meta.onReject(ticket)}
          disabled={meta.isApproving}
          className={`h-7 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 ${fullWidth ? 'flex-1' : ''}`}
        >
          <X className="h-3.5 w-3.5" />
          Rejeter
        </Button>
        <Button
          size="sm"
          onClick={() => meta.onApprove(ticket.commandeId)}
          disabled={meta.isApproving}
          className={`h-7 gap-1.5 bg-red-500 text-xs text-white hover:bg-red-600 disabled:opacity-60 ${fullWidth ? 'flex-1' : ''}`}
        >
          {isApprovingThis ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          Approuver
        </Button>
      </div>
    );
  }

  // AUTHENTIFIE / V1_VALIDE / V2_VALIDE / REJETE_FRAUDE → aucune action.
  return null;
}

/** Statuts proposés dans le filtre (tous sauf TARDIF). PENDING est le défaut. */
export const STATUT_FILTER_OPTIONS: { value: StatutControle; label: string }[] = [
  { value: StatutControle.PENDING, label: 'En attente' },
  { value: StatutControle.AUTHENTIFIE, label: 'Authentifié' },
  { value: StatutControle.V1_VALIDE, label: 'V1 Validé' },
  { value: StatutControle.V2_VALIDE, label: 'V2 Validé' },
  { value: StatutControle.REJETE_FRAUDE, label: 'Rejeté (Fraude)' },
];

export function createRegularisationTicketsColumns(): ColumnDef<BonLivraisonTerminee>[] {
  return [
    {
      accessorKey: 'reference',
      header: 'Référence',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-gray-900">{row.original.reference}</span>
      ),
    },
    {
      accessorKey: 'livreur',
      header: 'Livreur',
      cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.livreur}</span>,
    },
    {
      accessorKey: 'restaurant',
      header: 'Restaurant',
      cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.restaurant}</span>,
    },
    {
      accessorKey: 'coutCommande',
      header: () => <div className="w-full text-right">Montant CMD</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm text-gray-700">{formatMontant(row.original.coutCommande)}</div>
      ),
    },
    {
      accessorKey: 'coutLivraison',
      header: () => <div className="w-full text-right">Coût livraison</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-medium text-orange-500">
          {formatMontant(row.original.coutLivraison)}
        </div>
      ),
    },
    {
      id: 'dateHeure',
      header: 'Date / Heure',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{row.original.date}</span>
          <span className="text-xs text-gray-400">{row.original.heure}</span>
        </div>
      ),
    },
    {
      id: 'statut',
      header: 'Statut',
      cell: ({ row, table }) => {
        const meta = table.options.meta as RegularisationTicketsColumnMeta;
        const config = getRegularisationStatutConfig(row.original, meta.authenticatedIds);
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="w-full text-right">Actions</div>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as RegularisationTicketsColumnMeta;
        return (
          renderRegularisationActions(row.original, meta) ?? (
            <div className="text-right text-xs text-gray-300">—</div>
          )
        );
      },
    },
  ];
}
