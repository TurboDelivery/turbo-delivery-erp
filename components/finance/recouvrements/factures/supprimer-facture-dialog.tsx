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
import { useSupprimerFactureMutation } from '@/features/recouvrements/queries/facture.mutation';
import { getStatutLabel } from '@/features/recouvrements/utils/facture.utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SupprimerFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatJour = (d?: string) => {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd MMM yyyy', { locale: fr });
  } catch {
    return d;
  }
};

export const SupprimerFactureDialog = ({ facture, open, onOpenChange }: SupprimerFactureDialogProps) => {
  const { mutate: supprimerFacture, isLoading } = useSupprimerFactureMutation();

  const montantRegle = facture.montantRegle || 0;
  const aDesEncaissements = montantRegle > 0;

  const handleDelete = () => {
    supprimerFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer définitivement la facture ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                La facture <strong>{facture.code}</strong> du restaurant{' '}
                <strong>{facture.restaurantName}</strong> sera <strong>définitivement supprimée</strong>. À utiliser
                pour retirer un <strong>doublon</strong> ou une facture erronée.
              </p>

              {/* Identité de la facture — pour bien supprimer la BONNE parmi des doublons proches. */}
              <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Type / période</span>
                  <span className="text-right font-medium capitalize">
                    {facture.type?.toLowerCase()} · {formatJour(facture.periodeDebut)} → {formatJour(facture.periodeFin)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-semibold">{formatCFA(facture.montant || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-medium">{getStatutLabel(facture.statut)}</span>
                </div>
              </div>

              <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Cette action supprime définitivement :</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>la facture et tout son historique finance ;</li>
                  <li>les encaissements/recouvrements qui ne portent que sur cette facture ;</li>
                  <li>les contestations rattachées.</li>
                </ul>
              </div>

              {aDesEncaissements && (
                <p className="rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm font-medium text-amber-700">
                  ⚠️ Cette facture a déjà {formatCFA(montantRegle)} encaissé. Vérifiez bien que c&apos;est le doublon à
                  supprimer avant de continuer.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Action <strong>irréversible</strong> : la facture ne pourra pas être récupérée.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
