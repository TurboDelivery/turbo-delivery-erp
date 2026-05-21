'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, data: { date: string; montant: number; reference: string; banque: string }) => void;
}

export default function DepotBanqueModal({ open, onClose, facture, onConfirm }: Props) {
  const [date, setDate] = useState('');
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [banque, setBanque] = useState('');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) { setDate(''); setMontant(''); setReference(''); setBanque(''); }
  }, [open]);

  if (!open || !facture || !mounted) return null;

  const isValid = date.trim() && montant.trim() && reference.trim() && banque.trim();

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
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Dépôt en banque</h2>
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
              Date de dépôt <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              Montant déposé (F CFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex: 500000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              N° Bordereau <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: BRD-2024-001"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              Banque destinataire <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={banque}
              onChange={(e) => setBanque(e.target.value)}
              placeholder="Ex: BICICI, SGBCI..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            disabled={!isValid}
            onClick={() => {
              onConfirm(facture, { date: date.trim(), montant: Number(montant), reference: reference.trim(), banque: banque.trim() });
              onClose();
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
          >
            Enregistrer le dépôt
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
