'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRecouvrement } from '@/features/revenus/types/recouvrement/recouvrement.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCfa } from '@/utils/format.utils';
import { createUrlFile } from '@/utils/createUrlFile';
import { useState } from 'react';
import { ModifierRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/modifier-recouvrement-modal';
import { useSupprimerRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { IFacture } from '@/features/recouvrements/types';

function ActionsCell({ recouvrement }: { recouvrement: IRecouvrement }) {
  const [openEdit, setOpenEdit] = useState(false);
  const { mutate: supprimerMutation, isPending: isDeleting } = useSupprimerRecouvrementMutation();

  const handleDownload = () => {
    if (recouvrement.preuve) {
      const url = createUrlFile(recouvrement.preuve, 'backend');
      window.open(url, '_blank');
    }
  };

  const handleDelete = () => {
    supprimerMutation(recouvrement.id);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setOpenEdit(true)}>
          <Pencil className="size-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleDownload} disabled={!recouvrement.preuve}>
          <Download className="size-4" />
          <span>Preuve</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="animate-spin duration-300" /> : <Trash2 className="size-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le recouvrement ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le recouvrement de <strong>{formatCfa(recouvrement.montant)}</strong> du{' '}
                <strong>{format(new Date(recouvrement.dateRecouvrement), 'dd MMM yyyy', { locale: fr })}</strong> sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ModifierRecouvrementModal recouvrement={recouvrement} open={openEdit} onOpenChange={setOpenEdit} />
    </>
  );
}

export const recouvrementColumns: ColumnDef<IRecouvrement>[] = [
  {
    accessorKey: 'dateRecouvrement',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateRecouvrement'));
      return format(date, 'dd MMM yyyy', { locale: fr });
    },
  },
  {
    accessorKey: 'nomRestaurant',
    header: 'Restaurant',
    cell: ({ row }) => row.getValue('nomRestaurant') || '-',
  },
  {
    accessorKey: 'factures',
    header: 'Factures',
    cell: ({ row }) => {
      const factures = row.getValue('factures') as IFacture[];
      if (factures && factures.length > 0) {
        return factures.map((f) => f.code).join(', ');
      }
      return '-';
    },
  },
  {
    accessorKey: 'montant',
    header: 'Montant',
    cell: ({ row }) => formatCfa(row.getValue('montant')),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ActionsCell recouvrement={row.original} />,
  },
];
