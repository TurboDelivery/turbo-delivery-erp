'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Banknote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IAgentFacture } from '@/features/agent-recouvreur';
import { formatMontant } from './agent-recouvreur-columns';

/** Restant dû d'une facture (montant total − déjà recouvré). */
export function resteAEncaisser(f: IAgentFacture) {
  return Math.max(0, f.montant - (f.montantRecouvre ?? 0));
}

interface Props {
  open: boolean;
  onClose: () => void;
  factures: IAgentFacture[];
  running: boolean;
  progress: { done: number; total: number };
  onConfirm: (shared: { preuve?: string; remarque?: string }) => void;
}

/**
 * Encaissement en masse — marque chaque facture sélectionnée comme « soldée à
 * 100% » (paiement de type Solde = restant dû). Un seul justificatif + une seule
 * remarque, optionnels, appliqués à tout le lot. La logique d'enregistrement
 * (boucle sur la mutation d'encaissement unitaire) vit dans agent-recouvreur-view.
 */
export default function EncaisserLotModal({ open, onClose, factures, running, progress, onConfirm }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
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
      setFileName(null);
      setPreuveDataUrl(null);
      setRemarque('');
    }
  }, [open]);

  if (!mounted || !open) return null;

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

  const total = factures.reduce((s, f) => s + resteAEncaisser(f), 0);

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={running ? undefined : onClose}>
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-separator shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Encaisser la sélection à 100%</p>
              <p className="text-xs text-muted">{factures.length} facture(s) · total {formatMontant(total)}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={running} className="text-muted hover:text-foreground transition-colors disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800">
            Chaque facture ci-dessous sera enregistrée comme <strong>réglée à 100%</strong> (paiement « Solde » du restant dû,
            daté d&apos;aujourd&apos;hui). Le versement au caissier reste une étape séparée.
          </div>

          {/* Liste des factures du lot */}
          <div className="rounded-xl border border-separator divide-y divide-separator max-h-56 overflow-y-auto">
            {factures.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{f.numero}</p>
                  <p className="text-xs text-muted">{f.partenaire}</p>
                </div>
                <p className="font-semibold text-foreground">{formatMontant(resteAEncaisser(f))}</p>
              </div>
            ))}
            {factures.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted">Aucune facture éligible sélectionnée.</div>
            )}
          </div>

          {/* Justificatif partagé (optionnel) */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Justificatif partagé <span className="text-muted">(optionnel — appliqué à tout le lot)</span></label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-separator bg-surface-secondary px-4 py-4 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors">
              <Upload className="w-5 h-5 text-muted" />
              {fileName
                ? <p className="text-xs font-medium text-foreground">{fileName}</p>
                : <p className="text-xs text-muted">Choisir un fichier<br /><span className="text-muted">PNG, JPG ou PDF (max 10Mo)</span></p>
              }
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Remarque partagée (optionnel) */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Remarque partagée <span className="text-muted">(optionnel)</span></label>
            <textarea
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              placeholder="Ex. : encaissement groupé AL DAR du jour…"
              rows={2}
              className="w-full rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-green-300 resize-none"
            />
          </div>

          {running && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Encaissement en cours… {progress.done}/{progress.total}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5 pt-1 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={running} className="flex-1 text-sm">Annuler</Button>
          <Button
            onClick={() => onConfirm({ preuve: preuveDataUrl ?? undefined, remarque: remarque.trim() || undefined })}
            disabled={running || factures.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
          >
            {running ? 'Encaissement…' : `Encaisser ${factures.length} facture(s) à 100%`}
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
