'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  motif: string;
  onMotifChange: (v: string) => void;
}

export default function ApprobationFinaleRejetModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  motif,
  onMotifChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Rejeter l&apos;approbation finale</h2>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Le dossier sera renvoyé au niveau précédent pour correction.
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Motif du rejet
            </label>
            <Textarea
              value={motif}
              onChange={(e) => onMotifChange(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={4}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full px-6">
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!motif.trim() || isLoading}
            className="rounded-full px-6 bg-red-500 text-white hover:bg-red-600"
          >
            {isLoading ? 'Envoi...' : 'Confirmer le rejet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
