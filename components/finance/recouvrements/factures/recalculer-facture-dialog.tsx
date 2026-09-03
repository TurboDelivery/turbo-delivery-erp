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
import { useRecalculerFactureMutation } from '@/features/recouvrements/queries/facture.mutation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecalculerFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM yyyy', { locale: fr });
  } catch {
    return value;
  }
};

export const RecalculerFactureDialog = ({ facture, open, onOpenChange }: RecalculerFactureDialogProps) => {
  const { mutate: recalculerFacture, isPending: isLoading } = useRecalculerFactureMutation();

  const handleRecalculate = () => {
    recalculerFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recalculer la facture</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Le montant de la facture du restaurant <strong>{facture.restaurantName}</strong> sera recalculé à partir des
                courses actuelles, <strong>sur la même période</strong> :
              </p>
              <div className="rounded-md border bg-muted-surface/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Période</span>
                  <span className="font-medium">
                    {formatDate(facture.periodeDebut)} → {formatDate(facture.periodeFin)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Montant actuel</span>
                  <span className="font-semibold">{formatCFA(facture.montant || 0)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Utile si la facture avait été établie sur des données erronées. Le déjà-recouvré est conservé : seul le
                montant restant à payer est ajusté.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleRecalculate} disabled={isLoading}>
            {isLoading ? 'Recalcul...' : 'Recalculer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
