'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  // V52 (2026-05) — data.preuve = data URL base64 du reçu uploadé.
  // Optional pour rétrocompat avec les callers historiques.
  onConfirm: (
    facture: IFactureAgent,
    data: { montant: number; date: string; preuve?: string }
  ) => void;
}

export default function VerserComptableModal({ open, onClose, facture, onConfirm }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [montant, setMontant] = useState(0);
  const [date, setDate] = useState(today);
  const [fileName, setFileName] = useState<string | null>(null);
  // V52 — data URL base64 envoyée au backend (avant : seul le nom du
  // fichier était capturé, le contenu était perdu).
  const [preuveDataUrl, setPreuveDataUrl] = useState<string | null>(null);
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && facture) {
      setMontant(facture.montantRecouvre ?? facture.montant);
      setDate(today);
      setFileName(null);
      setPreuveDataUrl(null);
    }
  }, [open, facture]);

  if (!mounted || !open || !facture) return null;

  const totalCollecte = facture.montantRecouvre ?? facture.montant;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setPreuveDataUrl(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreuveDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    if (!facture) return;
    onConfirm(facture, { montant, date, preuve: preuveDataUrl ?? undefined });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Versement au caissier</p>
            <p className="text-xs mt-0.5">
              Total collecté disponible :{' '}
              <span className="text-red-500 font-semibold">{formatMontant(totalCollecte)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Montant */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Montant versé (F CFA)</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Date de versement</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          </div>

          {/* Preuve */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Preuve de versement</label>
            <label className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {fileName ?? 'Téléverser le reçu'}
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 text-white text-sm"
          >
            Confirmer le versement
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
