'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  codeCreneau: string;
  totaux: {
    livreurs: number;
    net: number;
  };
}

export default function ApprobationFinaleApprouverModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  codeCreneau,
  totaux,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Approuver et déclencher Wave</h2>
          <p className="text-sm text-gray-500 mt-0.5">Créneau : {codeCreneau}</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="rounded-xl bg-green-50 divide-y divide-green-100">
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">Nombre de Turboys</span>
              <span className="font-medium text-gray-900">{totaux.livreurs}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">Montant total à virer (Indépendants)</span>
              <span className="font-semibold text-emerald-600">{formatNumber(totaux.net)} FCFA</span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span className="font-bold">Attention :</span> Cette action déclenche immédiatement les
            virements Wave. Elle est irréversible.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full px-6">
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-full px-6 bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? 'Envoi...' : 'Confirmer et déclencher'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
