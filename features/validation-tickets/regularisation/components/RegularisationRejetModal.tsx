'use client';

import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MIN_MOTIF = 30;

interface Props {
  open: boolean;
  reference: string;
  motif: string;
  onMotifChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function RegularisationRejetModal({
  open,
  reference,
  motif,
  onMotifChange,
  onClose,
  onConfirm,
  isLoading,
}: Props) {
  const canConfirm = motif.trim().length >= MIN_MOTIF;
  const missing = MIN_MOTIF - motif.trim().length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <div className="border-b border-gray-100 px-6 pb-4 pt-6">
          <h2 className="text-lg font-bold text-gray-900">Rejeter le ticket</h2>
          {reference && <p className="mt-0.5 text-sm text-gray-500">{reference}</p>}
        </div>

        <div className="flex flex-col gap-2 px-6 py-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-red-600">
              Motif de rejet{' '}
              <span className="text-xs font-normal text-gray-400">
                (obligatoire, min {MIN_MOTIF} caractères)
              </span>
            </p>
          </div>
          <Textarea
            value={motif}
            onChange={(e) => onMotifChange(e.target.value)}
            placeholder="Décrivez la raison du rejet pour fraude..."
            rows={4}
            className="resize-none text-sm"
          />
          {motif.length > 0 && !canConfirm && (
            <p className="text-xs text-red-500">{missing} caractères manquants</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full px-6"
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
            className="rounded-full bg-red-500 px-6 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? 'Rejet...' : 'Confirmer le rejet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
