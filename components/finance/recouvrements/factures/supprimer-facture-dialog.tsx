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
import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';

import {
  LIBELLE_COMPOSANTE,
  useApercuSuppressionQuery,
} from '@/features/facturation-plage';

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

  // RG-06 / §5.3 — on demande au serveur ce que la suppression va emporter AVANT de
  // proposer de confirmer. Sans ça, supprimer une facture de frais laissait sa jumelle
  // de commission seule dans les encours, sans que rien ne l'annonce.
  const { data: apercu } = useApercuSuppressionQuery(facture.id, open);
  const [supprimerLiee, setSupprimerLiee] = useState(false);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    if (!open) {
      // Le choix ne doit jamais survivre à la fermeture : le rouvrir sur une AUTRE
      // facture avec « supprimer la jumelle » déjà coché emporterait une facture que
      // personne n'a demandé de supprimer.
      setSupprimerLiee(false);
      setMotif('');
    }
  }, [open]);

  const montantRegle = facture.montantRegle || 0;
  const aDesEncaissements = montantRegle > 0;
  const aUneJumelle = Boolean(apercu?.factureLieeId);

  const handleDelete = () => {
    supprimerFacture(
      { id: facture.id, motif: motif.trim() || undefined, supprimerLiee },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
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

              {aUneJumelle && (
                <div className="space-y-2 rounded-md border border-amber-400/60 bg-amber-50 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-amber-800">
                    <Link2 className="h-4 w-4" />
                    Cette facture est liée à une autre
                  </p>
                  <p className="text-amber-800">
                    <strong>{apercu?.factureLieeCode}</strong> porte{' '}
                    {LIBELLE_COMPOSANTE[apercu?.factureLieeComposante ?? ''] ??
                      apercu?.factureLieeComposante}{' '}
                    sur la même période, pour {formatCFA(apercu?.factureLieeMontant ?? 0)}. Les deux
                    couvrent ensemble la totalité de ce qui est facturé au partenaire.
                  </p>
                  <label className="flex cursor-pointer items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={supprimerLiee}
                      onChange={(e) => setSupprimerLiee(e.target.checked)}
                    />
                    <span className="text-amber-900">
                      Supprimer aussi <strong>{apercu?.factureLieeCode}</strong>
                      <span className="block text-xs font-normal text-amber-700">
                        Décoché, la facture liée est conservée et son lien est retiré. Elle reste
                        seule dans les encours sur cette période.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="motif-suppression">
                  Motif de la suppression
                </label>
                <input
                  id="motif-suppression"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Ex. doublon de la facture F20260801-AGHA-00123"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Journalisé avec votre nom et la période libérée (RG-06).
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Action <strong>irréversible</strong> : la facture ne pourra pas être récupérée.
                La période qu&apos;elle couvrait redevient facturable.
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
            {isLoading
              ? 'Suppression...'
              : supprimerLiee
                ? 'Supprimer les 2 factures'
                : 'Supprimer définitivement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
