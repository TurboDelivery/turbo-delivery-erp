'use client';

import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

interface Props {
  open: boolean;
  ligne: IGrillePaiementLigne | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

export default function ValiderLigneConfirmModal({ open, ligne, isLoading, onClose, onConfirm }: Props) {
  if (!ligne) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Valider la ligne livreur
          </DialogTitle>
          <p className="text-sm text-gray-500 pt-1">
            Lever le drapeau d&apos;attente pour{' '}
            <span className="font-semibold text-gray-800">
              {ligne.turboy.nom}
            </span>{' '}
            <span className="text-gray-400">({ligne.turboy.code})</span>
          </p>
        </DialogHeader>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-emerald-700 font-medium">Net à payer</span>
          <span className="text-base font-bold text-emerald-700">
            {formatNumber(ligne.netAPayer)} FCFA
          </span>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
            Cette action est <span className="font-semibold">irréversible</span>. Le drapeau d&apos;attente sera levé définitivement pour ce livreur.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validation…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Valider
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
