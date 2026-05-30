'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Landmark, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';
import type { IDepotBanqueDTO } from '@/features/responsable-financier';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, data: IDepotBanqueDTO) => void;
}

// SPEC-RECOUV-002 — référentiel simple des comptes Turbo (placeholder).
const BANQUES = ['NSIA Banque', 'Ecobank', 'SGCI', 'BICICI', 'Coris Bank', 'Orange Money', 'Wave', 'Autre'];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DepotBanqueModal({ open, onClose, facture, onConfirm }: Props) {
  const [date, setDate] = useState('');
  const [numeroBordereau, setNumeroBordereau] = useState('');
  const [banque, setBanque] = useState('');
  const [montant, setMontant] = useState('');
  const [preuve, setPreuve] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && facture) {
      setDate('');
      setNumeroBordereau('');
      setBanque('');
      setMontant(String(facture.montant ?? ''));
      setPreuve(null);
      setFileName(null);
    }
  }, [open, facture]);

  if (!open || !facture || !mounted) return null;

  const valid = date.trim() && numeroBordereau.trim() && banque.trim() && montant.trim() && preuve;

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setPreuve(await fileToDataUrl(file));
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
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

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Facture <strong className="text-gray-900">{facture.numero}</strong> — {facture.partenaire}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Date de dépôt <span className="text-red-500">*</span></label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">N° de bordereau <span className="text-red-500">*</span></label>
              <input type="text" value={numeroBordereau} onChange={(e) => setNumeroBordereau(e.target.value)} placeholder="ex. BRD-2026-001"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Banque / agence <span className="text-red-500">*</span></label>
              <select value={banque} onChange={(e) => setBanque(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400 bg-white">
                <option value="">Sélectionner…</option>
                {BANQUES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Montant déposé <span className="text-red-500">*</span></label>
              <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400" />
              <p className="text-[11px] text-gray-400 mt-1">Doit égaler le montant visé.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Preuve (bordereau scanné) <span className="text-red-500">*</span></label>
            <label className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors">
              <Upload className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-xs text-gray-600 truncate">{fileName ?? 'Importer le bordereau (PDF, PNG, JPG)'}</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">Annuler</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirm(facture, {
                date: date.trim(),
                numeroBordereau: numeroBordereau.trim(),
                preuveBordereau: preuve as string,
                banqueAgence: banque.trim(),
                montantDepose: Number(montant),
              });
              onClose();
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
          >
            <Landmark className="w-4 h-4 mr-1.5" />
            Enregistrer le dépôt
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
