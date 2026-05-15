'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';

type CyclePaiement = 'Journalier' | 'Hebdomadaire' | 'Mensuel';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, cycle: CyclePaiement) => void;
}

const CYCLES: CyclePaiement[] = ['Journalier', 'Hebdomadaire', 'Mensuel'];

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
}

export default function ValiderFactureModal({ open, onClose, facture, onConfirm }: Props) {
  const [cycle, setCycle] = useState<CyclePaiement>('Mensuel');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  if (!open || !facture || !mounted) return null;

  function handleConfirm() {
    if (facture) onConfirm(facture, cycle);
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Valider la facture</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Info banner */}
          <div className="flex gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-0.5">Validation de facture</p>
              <p>
                Vous êtes sur le point de valider la facture{' '}
                <strong>{facture.numero}</strong> pour le partenaire{' '}
                <strong>{facture.partenaire}</strong>. Cette action déclenchera le processus de
                recouvrement.
              </p>
            </div>
          </div>

          {/* Fields row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">N° Facture</label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-medium">
                {facture.numero}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Partner</label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {facture.partenaire}
              </div>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Montant</label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-semibold">
              {formatMontant(facture.montant)}
            </div>
          </div>

          {/* Cycle de paiement */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              Cycle de paiement <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {CYCLES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    cycle === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Valider la facture
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
