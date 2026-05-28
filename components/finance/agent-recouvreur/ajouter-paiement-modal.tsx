'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';

export interface IPaiement {
  id: string;
  type: 'Acompte' | 'Solde';
  date: string;
  montant: number;
  preuve?: string;
  remarque?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  montantDejaRecouvre: number;
  onConfirm: (paiement: Omit<IPaiement, 'id'>) => void;
}

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
}

export default function AjouterPaiementModal({ open, onClose, facture, montantDejaRecouvre, onConfirm }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<'Acompte' | 'Solde'>('Acompte');
  const [date, setDate] = useState(today);
  const [montant, setMontant] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  // V52 (2026-05) — On stocke aussi le contenu en data URL base64 pour
  // l'envoi au backend. Avant : seul le nom du fichier était capturé,
  // donc la preuve était silencieusement perdue au backend (champ DTO
  // recevait juste un nom de fichier sans contenu).
  const [preuveDataUrl, setPreuveDataUrl] = useState<string | null>(null);
  const [remarque, setRemarque] = useState('');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setType('Acompte');
      setDate(today);
      setMontant(0);
      setFileName(null);
      setPreuveDataUrl(null);
      setRemarque('');
    }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setPreuveDataUrl(null);
      return;
    }
    setFileName(file.name);
    // V52 — lire le fichier en data URL base64 pour l'envoyer au backend.
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreuveDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  if (!open || !facture || !mounted) return null;

  const restant = facture.montant - montantDejaRecouvre;

  function handleConfirm() {
    // V52 — envoyer la data URL base64 (pas juste le nom du fichier comme
    // avant) pour que le backend puisse persister la preuve.
    onConfirm({ type, date, montant, preuve: preuveDataUrl ?? undefined, remarque: remarque || undefined });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Ajouter un paiement</p>
              <p className="text-xs text-gray-400">Facture {facture.numero}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Résumé montants */}
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <div>
              <p className="text-xs text-blue-500 mb-0.5">Montant total</p>
              <p className="text-sm font-bold text-gray-800">{formatMontant(facture.montant)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500 mb-0.5">Déjà recouvré</p>
              <p className="text-sm font-bold text-gray-800">{formatMontant(montantDejaRecouvre)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500 mb-0.5">Restant à recouvrer</p>
              <p className="text-sm font-bold text-red-500">{formatMontant(restant)}</p>
            </div>
          </div>

          {/* Type de paiement */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Type de paiement <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(['Acompte', 'Solde'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold">{t}</p>
                  <p className="text-xs opacity-70">{t === 'Acompte' ? 'Paiement partiel' : 'Paiement total'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Montant */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">📅 Date du paiement <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">💲 Montant <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={montant || ''}
                  min={0}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">FCFA</span>
              </div>
            </div>
          </div>

          {/* Preuve */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Preuve de paiement <span className="text-red-500">*</span></label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-5 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              {fileName
                ? <p className="text-xs font-medium text-gray-700">{fileName}</p>
                : <p className="text-xs text-gray-400">Choisir pour télécharger<br /><span className="text-gray-300">PNG, JPG ou PDF (max 10Mo)</span></p>
              }
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Remarque */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
              <input type="checkbox" className="rounded" /> Remarque (optionnel)
            </label>
            <textarea
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              placeholder="Écrivez des remarques sur ce paiement..."
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="flex-1 text-sm">Annuler</Button>
          <Button
            onClick={handleConfirm}
            disabled={!montant || !date}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
          >
            Enregistrer le paiement
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
