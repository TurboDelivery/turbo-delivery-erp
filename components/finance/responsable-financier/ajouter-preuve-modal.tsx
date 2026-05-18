'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileUp, FileText, ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, reference: string) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function AjouterPreuveModal({ open, onClose, facture, onConfirm }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setFileDataUrl('');
      setError('');
      setIsDragging(false);
    }
  }, [open]);

  const processFile = useCallback((f: File) => {
    setError('');
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Format non supporté. Acceptés : PDF, JPEG, PNG, WEBP, GIF.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Le fichier dépasse la limite de ${MAX_SIZE_MB} Mo.`);
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataUrl(e.target?.result as string);
      setFile(f);
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier.');
      setLoading(false);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  if (!open || !facture || !mounted) return null;

  const isPdf = file?.type === 'application/pdf';

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
              <FileUp className="w-4 h-4 text-purple-600" />
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

          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-3 transition-colors ${
                isDragging
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Glisser-déposer ou <span className="text-purple-600">parcourir</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG — max {MAX_SIZE_MB} Mo</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              {!isPdf && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 bg-white max-h-40 flex items-center justify-center">
                  <img src={fileDataUrl} alt="Apercu" className="max-h-40 object-contain" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  {isPdf
                    ? <FileText className="w-5 h-5 text-purple-600" />
                    : <ImageIcon className="w-5 h-5 text-purple-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setFileDataUrl(''); setError(''); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            disabled={!file || loading}
            onClick={() => {
              if (facture && fileDataUrl) {
                onConfirm(facture, fileDataUrl);
                onClose();
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Ajouter la preuve'}
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
