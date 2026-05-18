'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, preuveUrl: string) => void;
}

export default function AjouterPreuveModal({ open, onClose, facture, onConfirm }: Props) {
  const [preuveUrl, setPreuveUrl] = useState('');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setPreuveUrl('');
  }, [open]);

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
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Ajouter une preuve</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Facture <strong className="text-gray-900">{facture.numero}</strong> — {facture.partenaire}
          </p>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              URL de la preuve <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={preuveUrl}
              onChange={(e) => setPreuveUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            disabled={!preuveUrl.trim()}
            onClick={() => { onConfirm(facture, preuveUrl.trim()); onClose(); }}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
          >
            Ajouter la preuve
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
