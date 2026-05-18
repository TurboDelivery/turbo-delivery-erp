'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF) => void;
}

export default function ViserDgModal({ open, onClose, facture, onConfirm }: Props) {
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  if (!open || !facture || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Viser par le DG</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700">
            Vous êtes sur le point de viser la facture{' '}
            <strong className="text-gray-900">{facture.numero}</strong> pour{' '}
            <strong className="text-gray-900">{facture.partenaire}</strong> par le Directeur Général.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">N° Facture</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                {facture.numero}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Statut actuel</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Validé
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            onClick={() => { onConfirm(facture); onClose(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Confirmer le visa DG
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
