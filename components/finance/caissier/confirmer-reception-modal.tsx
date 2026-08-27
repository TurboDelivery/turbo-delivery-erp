'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureCaissier } from '@/features/caissier';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureCaissier | null;
  onConfirm: (facture: IFactureCaissier, data: { reference: string }) => void;
}

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

export default function ConfirmerReceptionModal({ open, onClose, facture, onConfirm }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [reference, setReference] = useState('');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setReference('');
    }
  }, [open]);

  if (!mounted || !open || !facture) return null;

  function handleConfirm() {
    if (!facture) return;
    onConfirm(facture, { reference });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-indigo-50">
          <div>
            <p className="text-sm font-semibold text-indigo-900">Enregistrer la fiche de paiement</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              {facture.numero} — {facture.partenaire}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Info montant */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Montant recouvré</span>
            <span className="text-sm font-bold text-gray-900">
              {formatMontant(facture.montantRecouvre ?? facture.montant)}
            </span>
          </div>

          {/* Référence fiche de paiement */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Référence fiche de paiement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex : FP-2026-0042"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reference.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
          >
            Enregistrer la fiche
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
