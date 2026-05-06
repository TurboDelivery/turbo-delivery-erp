'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  motif: string;
  onMotifChange: (v: string) => void;
  totaux: {
    livreurs: number;
    tickets: number;
    net: number;
  };
}

export default function VisaDgaRejetModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  motif,
  onMotifChange,
  totaux,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Rejeter le Créneau</h2>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Résumé */}
          <div className="rounded-xl bg-red-50 divide-y divide-red-100">
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-600">Nombre de Turboys</span>
              <span className="font-medium text-gray-900">{totaux.livreurs}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-600">Tickets totaux</span>
              <span className="font-medium text-gray-900">{totaux.tickets}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-600">Montant Net Total</span>
              <span className="font-semibold text-emerald-600">
                {formatNumber(totaux.net)} FCFA
              </span>
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Commentaire de rejet
            </label>
            <Textarea
              value={motif}
              onChange={(e) => onMotifChange(e.target.value)}
              placeholder="Expliquez la raison du rejet pour renvoyer à la Comptabilité..."
              rows={4}
              className="resize-none text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full px-6">
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!motif.trim() || isLoading}
            className="rounded-full px-6 bg-red-500 text-white hover:bg-red-600"
          >
            {isLoading ? 'Envoi...' : 'Confirmer le Rejet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
