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
    tickets: number;
    net: number;
  };
}

export default function VisaDgaViserModal({
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
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Viser et Transmettre au PDG</h2>
          <p className="text-sm text-gray-500 mt-0.5">Créneau : {codeCreneau}</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Résumé */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Résumé du Créneau</p>
            <div className="rounded-xl bg-green-50 divide-y divide-green-100">
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">Nombre de Turboys</span>
                <span className="font-medium text-gray-900">{totaux.livreurs}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">Tickets totaux</span>
                <span className="font-medium text-gray-900">{totaux.tickets}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">Montant Net Total</span>
                <span className="font-semibold text-emerald-600">
                  {formatNumber(totaux.net)} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Info block */}
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="font-bold">Action :</span> Le Créneau sera marqué comme &quot;Visé
            DGA&quot; et transmis automatiquement au PDG pour l&apos;approbation finale.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
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
            disabled={isLoading}
            className="rounded-full px-6 bg-red-500 text-white hover:bg-red-600"
          >
            {isLoading ? 'Envoi...' : 'Viser et Transmettre'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
