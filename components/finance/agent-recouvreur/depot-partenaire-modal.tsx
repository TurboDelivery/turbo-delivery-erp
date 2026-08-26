'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  agentNom?: string;
  onConfirm: (facture: IFactureAgent, data: { date: string; montant: number; agent: string }) => void;
}

// Date locale au format YYYY-MM-DD (le toISOString() partirait en UTC et
// décalerait d'un jour autour de minuit côté Abidjan).
function toLocalYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export default function DepotPartenaireModal({ open, onClose, facture, agentNom = '', onConfirm }: Props) {
  // Snapshot de la date à l'ouverture du modal. Le Recouvreur ne saisit plus
  // la date manuellement : elle est capturée automatiquement au moment où il
  // ouvre la confirmation du dépôt.
  const [submissionMoment, setSubmissionMoment] = useState<Date>(() => new Date());
  const [fileName, setFileName] = useState<string | null>(null);
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  // Re-snapshote le moment à chaque ouverture / changement de facture.
  useEffect(() => {
    if (open) {
      setSubmissionMoment(new Date());
      setFileName(null);
    }
  }, [open, facture?.id]);

  if (!open || !facture || !mounted) return null;

  function handleConfirm() {
    if (!facture) return;
    // Aucun montant recouvré au stade du dépôt — l'encaissement (acompte/solde)
    // se fait via le bouton "Encaisser" qui apparaît une fois le dépôt enregistré.
    onConfirm(facture, {
      date: toLocalYMD(submissionMoment),
      montant: 0,
      agent: agentNom,
    });
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
          <h2 className="text-base font-semibold text-gray-900">Déposer la facture chez le partenaire</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Facture info */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{facture.partenaire}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">{facture.numero}</p>
              <p className="text-sm font-bold text-red-500">{formatMontant(facture.montant)}</p>
            </div>
          </div>

          {/* Date+heure + Agent (tous deux en lecture seule) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex text-xs text-gray-500 mb-1.5 items-center gap-1">
                <span>📅</span> Date du dépôt
              </label>
              <div
                aria-readonly="true"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-not-allowed select-none"
              >
                {dateFormatter.format(submissionMoment)}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Capturée automatiquement à l&apos;ouverture du formulaire.</p>
            </div>
            <div>
              <label className="flex text-xs text-gray-500 mb-1.5 items-center gap-1">
                <span>👤</span> Agent recouvreur
              </label>
              <input
                type="text"
                value={agentNom || '—'}
                readOnly
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-not-allowed disabled:opacity-100"
              />
            </div>
          </div>

          {/* Montant recouvré — désactivé : pas de paiement à ce stade */}
          <div>
            <label className="flex text-xs text-gray-400 mb-1.5 items-center gap-1">
              <span>🔗</span> Montant recouvré (cumul)
            </label>
            <input
              type="number"
              value={0}
              readOnly
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400 cursor-not-allowed disabled:opacity-100"
            />
            <p className="text-xs mt-1.5 text-gray-400 italic">
              Aucun paiement n&apos;est saisi au dépôt — utilisez « Encaisser » après enregistrement pour ajouter un acompte ou solder la facture.
            </p>
          </div>

          {/* Preuve de dépôt */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Preuve de dépôt</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-red-500" />
              </div>
              {fileName ? (
                <p className="text-xs font-medium text-gray-700">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Glissez-déposez le bordereau partenaire</p>
                  <p className="text-xs text-gray-400">Bon de réception signé · PDF, PNG, JPG (max 10 Mo)</p>
                </>
              )}
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  (e.currentTarget.parentElement?.querySelector('input[type=file]') as HTMLInputElement)?.click();
                }}
              >
                Parcourir
              </button>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="flex-1 text-sm">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-red-400 hover:bg-red-500 text-white text-sm"
          >
            Enregistrer le dépôt
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
