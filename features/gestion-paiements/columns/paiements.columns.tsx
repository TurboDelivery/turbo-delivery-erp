'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button, Chip } from '@heroui/react';
import { FileText, Trash2, Wallet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Can } from '@/components/auth/Can';
import { IChargeFixe, StatutChargeFixe } from '@/features/charges/types/charge-fixe.type';

const STATUT_CONFIG: Record<string, { label: string; color: 'warning' | 'primary' | 'success' | 'danger' | 'default' }> = {
  PENDING: { label: 'En attente', color: 'warning' },
  EN_ATTENTE_DGA: { label: 'En attente DGA', color: 'warning' },
  VALIDE_DGA: { label: 'Validé DGA', color: 'primary' },
  APPROUVE_DG: { label: 'Approuvé DG', color: 'success' },
  REJETE_DGA: { label: 'Rejeté DGA', color: 'danger' },
  REJETE_DG: { label: 'Rejeté DG', color: 'danger' },
  DECAISSE: { label: 'Décaissé', color: 'success' },
  PAID: { label: 'Décaissé', color: 'success' },
};

const DECAISSE_STATUTS = ['DECAISSE', 'PAID'];

export function isDecaisse(row: IChargeFixe) {
  return DECAISSE_STATUTS.includes(row.statut);
}

/** Config de statut partagée colonne (desktop) + carte mobile — pas de divergence. */
export function getPaiementStatutConfig(statut: string) {
  return STATUT_CONFIG[statut] ?? { label: statut, color: 'default' as const };
}

type PaiementsColumnsOptions = {
  onDecaisser: (id: string) => void;
  isPending: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onDeleteFixe?: (id: string) => void;
  isDeletingFixe?: boolean;
  onRapport?: (charge: IChargeFixe) => void;
};

export function createPaiementsColumns({ onDecaisser, isPending, onDelete, isDeleting, onDeleteFixe, isDeletingFixe, onRapport }: PaiementsColumnsOptions): ColumnDef<IChargeFixe>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const disabled = isDecaisse(row.original);
        return <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} disabled={disabled} aria-label="Select row" />;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => <span className="text-sm text-gray-900">{row.getValue('designation')}</span>,
    },
    {
      id: 'categorie',
      header: 'Catégorie',
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.categorie?.nomCategorie ?? 'â€”'}</span>,
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{row.getValue<number>('montant').toLocaleString('fr-FR')} FCFA</span>,
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => {
        const statut = row.getValue<StatutChargeFixe>('statut');
        const config = STATUT_CONFIG[statut] ?? { label: statut, color: 'default' as const };
        return (
          <Chip color={config.color} variant="flat" size="sm">
            {config.label}
          </Chip>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            {!isDecaisse(row.original) && (
              <Button size="sm" color="warning" variant="flat" startContent={<Wallet size={14} />} isLoading={isPending} onPress={() => onDecaisser(row.original.id)}>
                Décaisser
              </Button>
            )}
            {isDecaisse(row.original) && row.original.codeSysteme === 'MASSE_SALARIALE_NETTE' && (
              <Button size="sm" color="success" variant="flat" startContent={<FileText size={14} />} onPress={() => onRapport?.(row.original)}>
                Rapport
              </Button>
            )}
            {onDelete && (
              <Can I="delete" a="ChargeVariable">
                <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => onDelete(row.original.id)} isLoading={isDeleting} aria-label="Supprimer la charge variable">
                  <Trash2 size={14} />
                </Button>
              </Can>
            )}
            {onDeleteFixe && (
              <Can I="delete" a="ChargeFixe">
                <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => onDeleteFixe(row.original.id)} isLoading={isDeletingFixe} aria-label="Supprimer la dépense du mois">
                  <Trash2 size={14} />
                </Button>
              </Can>
            )}
          </div>
        );
      },
    },
  ];
}

