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
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useReinitialiserFactureMutation } from '@/features/recouvrements/queries/facture.mutation';

interface ReinitialiserFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReinitialiserFactureDialog = ({ facture, open, onOpenChange }: ReinitialiserFactureDialogProps) => {
  const { mutate: reinitialiserFacture, isLoading } = useReinitialiserFactureMutation();

  const handleReset = () => {
    reinitialiserFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réinitialiser la facture ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tout le recouvrement de la facture <strong>{facture.code}</strong> du restaurant{' '}
                <strong>{facture.restaurantName}</strong> sera annulé. La facture repart à l’étape{' '}
                <strong>« validée, non payée »</strong>.
              </p>
              <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Cette action supprime définitivement :</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>tous les recouvrements (encaissements) enregistrés sur cette facture ;</li>
                  <li>les dépôts, le visa DGA, l’orientation des fonds, le bordereau et les preuves.</li>
                </ul>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">Montant à recouvrer de nouveau</span>
                <span className="font-semibold">{formatCFA(facture.montant || 0)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Action irréversible. Le comptable devra reprendre le recouvrement depuis le début.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
