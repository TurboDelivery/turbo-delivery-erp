'use client';

import { X, Download, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  preuve: string | null | undefined;
  factureNumero?: string;
  // V52 (2026-05) — Titre custom pour distinguer les 3 modals de preuves
  // dans le panel "Preuves & Documents" (fiche paiement / encaissement /
  // versement caissier). Si omis, fallback "Preuve de dépôt".
  titre?: string;
}

export default function PreuveModal({ open, onClose, preuve, factureNumero, titre }: Props) {
  if (!open) return null;

  const isPdf = preuve?.startsWith('data:application/pdf') || preuve?.toLowerCase().endsWith('.pdf');
  const isImage = preuve?.startsWith('data:image') ||
    /\.(jpe?g|png|webp|gif)$/i.test(preuve ?? '');
  const isHttpUrl = preuve?.startsWith('http://') || preuve?.startsWith('https://');

  function handleDownload() {
    if (!preuve) return;
    const a = document.createElement('a');
    a.href = preuve;
    a.download = `preuve-${factureNumero ?? 'facture'}`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {titre ?? 'Preuve de dépôt'}{factureNumero ? ` — ${factureNumero}` : ''}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {preuve && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {!preuve ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune preuve disponible</p>
              <p className="text-xs mt-1">La preuve n&apos;a pas encore été ajoutée pour cette facture.</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={preuve}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '60vh' }}
              title="Preuve PDF"
            />
          ) : isImage ? (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-4" style={{ minHeight: '40vh' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preuve}
                alt="Preuve de dépôt"
                className="max-w-full max-h-[55vh] object-contain rounded"
              />
            </div>
          ) : isHttpUrl ? (
            <iframe
              src={preuve}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '60vh' }}
              title="Preuve"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Format non reconnu</p>
              <p className="text-xs mt-1 font-mono break-all max-w-xs text-center">{preuve.slice(0, 80)}…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
