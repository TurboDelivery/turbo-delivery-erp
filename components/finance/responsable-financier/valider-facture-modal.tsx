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

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
}

/**
 * Mapping backend `facture.type` → libellé UI cycle. Le backend stocke des
 * codes upper-case (QUOTIDIEN, HEBDOMADAIRE, MENSUEL) dérivés du restaurant
 * par FacturationJobService.mapMethodToFactureType — on n'a plus à les
 * re-saisir (fix A1 workflow facture, 2026-05).
 */
function backendCycleToLabel(raw: string | undefined): CyclePaiement {
  if (!raw) return 'Mensuel';
  const upper = raw.toUpperCase();
  if (upper.startsWith('QUOTID') || upper === 'JOURNALIER') return 'Journalier';
  if (upper.startsWith('HEBDO')) return 'Hebdomadaire';
  if (upper.startsWith('MENSU')) return 'Mensuel';
  // Fallback : si le backend renvoie déjà un libellé UI lisible, l'utiliser.
  if (raw === 'Journalier' || raw === 'Hebdomadaire' || raw === 'Mensuel') {
    return raw as CyclePaiement;
  }
  return 'Mensuel';
}

export default function ValiderFactureModal({ open, onClose, facture, onConfirm }: Props) {
  // Fix A1 : le cycle est dérivé du restaurant côté backend (champ
  // facture.cycle déjà set à la création) et n'est plus saisi par l'utilisateur.
  // On le calcule au render à partir de la facture courante pour rester
  // synchronisé même si plusieurs validations sont ouvertes successivement.
  const cycleAffiche = backendCycleToLabel(facture?.cycle);

  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  if (!open || !facture || !mounted) return null;

  function handleConfirm() {
    // Fix A1 : on envoie quand même le cycle au backend pour compatibilité
    // (le backend l'ignore s'il est null, mais on garde le contrat existant
    // côté frontend pour ne pas avoir à toucher la mutation).
    if (facture) onConfirm(facture, cycleAffiche);
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

          {/* Cycle de paiement — Fix A1 : lecture seule, dérivé du restaurant */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Cycle de paiement</label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-medium flex items-center justify-between">
              <span>{cycleAffiche}</span>
              <span className="text-xs text-gray-400 italic">configuré dans le profil partenaire</span>
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
