'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  agentNom?: string;
  onConfirm: (facture: IFactureAgent, data: { date: string; montant: number; agent: string }) => void;
}

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

/**
 * Fix C (workflow facture, 2026-05) : modal allégée — le dépôt physique
 * chez le partenaire est désormais une action one-click qui se contente de
 * timestamper le dépôt côté backend.
 *
 * Changements UX par rapport à l'ancienne version :
 *  - Date : retirée du formulaire ; affichage "Aujourd'hui" en lecture seule
 *    (capture auto côté backend via LocalDate.now()).
 *  - Montant recouvré : grisé (disabled). L'encaissement est une étape
 *    séparée — le recouvreur clique "Encaisser" depuis la table après le
 *    dépôt pour saisir un versement (acompte ou solde).
 *  - Preuve de dépôt : conservée (upload du bordereau signé).
 *  - Bouton CTA renommé "Déposer chez le partenaire" (action unique).
 *
 * Le backend ignore désormais date et montant envoyés ici (rétrocompat
 * pour ne pas casser l'API). Donc on garde l'envoi du payload identique.
 */
export default function DepotPartenaireModal({ open, onClose, facture, agentNom = 'KOUASSI MEDARD', onConfirm }: Props) {
  const today = new Date().toISOString().split('T')[0];
  // date et montant restent dans le state pour rester rétrocompat avec le
  // contrat onConfirm — mais ils ne sont plus saisissables (cf. JSX).
  const [date] = useState(today);
  const [fileName, setFileName] = useState<string | null>(null);
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  if (!open || !facture || !mounted) return null;

  function handleConfirm() {
    // Fix C : on envoie montant=0 (le backend l'ignore — cf.
    // AgentRecouvreurDepotPartenaireRequestDto et fix marquerDepotPartenaireAgent
    // qui force LocalDate.now() et ne lit pas montant).
    if (facture) onConfirm(facture, { date, montant: 0, agent: agentNom });
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

          {/* Date + Agent — Fix C : date capturée automatiquement (lecture seule) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex text-xs text-gray-500 mb-1.5 items-center gap-1">
                <span>📅</span> Date du dépôt
              </label>
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Aujourd&apos;hui
                <span className="text-xs text-gray-400 italic ml-2">(capture automatique)</span>
              </div>
            </div>
            <div>
              <label className="flex text-xs text-gray-500 mb-1.5 items-center gap-1">
                <span>👤</span> Agent recouvreur
              </label>
              <input
                type="text"
                value={agentNom}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-default"
              />
            </div>
          </div>

          {/* Paiement — Fix C : grisé/désactivé. L'encaissement est une étape
              séparée (bouton "Encaisser" depuis la table une fois le dépôt
              effectué). Garder ce champ en lecture seule sert d'indice UX :
              le recouvreur sait où chercher mais comprend qu'il n'y a rien à
              renseigner ici. */}
          <div>
            <label className="flex text-xs text-gray-500 mb-1.5 items-center gap-1">
              <span>🔗</span> Paiement
              <span className="text-xs text-gray-400 italic">— à renseigner via &laquo; Encaisser &raquo;</span>
            </label>
            <input
              type="number"
              value={0}
              disabled
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              placeholder="Aucun paiement à cette étape"
            />
            <p className="text-xs mt-1.5 text-gray-400">
              Montant facture : {formatMontant(facture.montant)}. Un encaissement
              (acompte ou solde) sera saisi séparément après le dépôt.
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
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
          >
            Déposer chez le partenaire
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
