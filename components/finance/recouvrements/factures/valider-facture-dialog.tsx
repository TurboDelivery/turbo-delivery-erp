'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCfa } from '@/utils/format.utils';
import { useValiderFactureMutation } from '@/features/recouvrements/queries/facture.mutation';

interface ValiderFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ValiderFactureDialog = ({ facture, open, onOpenChange }: ValiderFactureDialogProps) => {
  const { mutate: validerFacture, isPending } = useValiderFactureMutation();

  const handleValidate = () => {
    validerFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider la facture</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir valider cette facture pour le restaurant <strong>{facture.restaurantName}</strong> d&apos;un montant de{' '}
            <strong>{formatCfa(facture.montant || 0)}</strong> ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleValidate} disabled={isPending}>
            {isPending ? 'Validation...' : 'Confirmer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


