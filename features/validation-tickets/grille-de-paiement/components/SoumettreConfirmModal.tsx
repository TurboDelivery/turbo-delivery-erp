'use client';

import { Info } from 'lucide-react';
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
  totaux: {
    livreurs: number;
    tickets: number;
    net: number;
  };
  commentaire: string;
  onCommentaireChange: (v: string) => void;
}

export default function SoumettreConfirmModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  totaux,
  commentaire,
  onCommentaireChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Soumettre le Créneau au DGA</h2>
          <p className="text-sm text-gray-400 mt-0.5">Vérification finale avant transmission</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Résumé */}
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-2">Résumé du Créneau</p>
            <div className="rounded-xl bg-gray-50 divide-y divide-gray-100">
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
          </div>

          {/* Commentaire */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Commentaire</label>
            <Textarea
              value={commentaire}
              onChange={(e) => onCommentaireChange(e.target.value)}
              placeholder="Ajoutez des notes pour le DGA..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <Info className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700">
              Une fois soumis, le Créneau sera transmis au DGA pour visa. Vous serez notifié de la
              décision.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {isLoading ? 'Envoi...' : 'Confirmer la Soumission'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
