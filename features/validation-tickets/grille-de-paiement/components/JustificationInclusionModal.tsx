'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IGrillePaiementLigne, TypeLivreur } from '../types/grille-paiement.type';

const JUSTIFICATION_MIN = 30;

interface Props {
  open: boolean;
  ligne: IGrillePaiementLigne | null;
  /** L'état cible que la checkbox veut atteindre (true = inclure, false = exclure). */
  nextValue: boolean;
  /** Statut courant du lot — sert à prévenir d'une re-soumission au DGA. */
  lotStatut?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

/**
 * V54 (2026-05) — Modale Comptable : force la saisie d'une justification
 * d'au moins {@value JUSTIFICATION_MIN} caractères avant d'envoyer un
 * override d'inclusion. Si le lot est déjà SOUMIS_DGA / VALIDE_DGA /
 * APPROUVE_DG, un bandeau avertit que la modification déclenchera une
 * re-soumission au DGA.
 *
 * <p>Côté backend : le DTO {@code ModifierInclusionLigneDto} valide
 * {@code @NotBlank @Size(min=30)} sur la justification — la modale doit
 * empêcher l'envoi tant que ce seuil n'est pas atteint sinon on prend
 * un 400.</p>
 */
export default function JustificationInclusionModal({
  open,
  ligne,
  nextValue,
  lotStatut,
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  const [justification, setJustification] = useState('');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setJustification('');
  }, [open]);

  if (!open || !ligne || !mounted) return null;

  const remaining = Math.max(0, JUSTIFICATION_MIN - justification.trim().length);
  const isValid = justification.trim().length >= JUSTIFICATION_MIN;
  const reSoumissionRequise =
    lotStatut === 'SOUMIS_DGA' || lotStatut === 'VALIDE_DGA' || lotStatut === 'APPROUVE_DG';

  const action = nextValue ? 'inclure' : 'exclure';
  const actionMaj = nextValue ? 'Inclure' : 'Exclure';
  const typeLabel = typeLivreurLabel(ligne.typeLivreur ?? null);

  function handleConfirm() {
    if (!isValid) return;
    onConfirm(justification.trim());
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                nextValue ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 ${nextValue ? 'text-emerald-600' : 'text-amber-600'}`}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {actionMaj} cette ligne du paiement
              </p>
              <p className="text-xs text-gray-400">
                {ligne.turboy.nom}
                {ligne.turboy.code && <span className="ml-1 text-gray-300">({ligne.turboy.code})</span>}
                {' — '}
                <span className="font-medium">{typeLabel}</span>
              </p>
            </div>
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
        <div className="px-6 py-5 space-y-4">
          {/* Bandeau re-soumission si lot déjà engagé dans le workflow DGA */}
          {reSoumissionRequise && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold mb-0.5">
                  Le lot a déjà été soumis au DGA.
                </p>
                <p>
                  Modifier l&apos;inclusion remettra le lot en{' '}
                  <span className="font-mono">CALCUL_EN_COURS</span> et nécessitera
                  une nouvelle soumission.
                </p>
              </div>
            </div>
          )}

          {/* Bandeau type implicite */}
          {ligne.typeLivreur === null || ligne.typeLivreur === undefined ? (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
              Ce livreur est <span className="font-semibold">à catégoriser</span>. Demandez
              à la RH d&apos;assigner un type avant d&apos;inclure manuellement.
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600">
              Type par défaut : <span className="font-semibold">{typeLabel}</span> —{' '}
              {ligne.typeLivreur === 'INDEPENDANT'
                ? 'normalement inclus dans la paie hebdomadaire.'
                : 'normalement exclu de la paie hebdomadaire.'}
            </div>
          )}

          {/* Justification */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Justification <span className="text-red-500">*</span>
              <span className="ml-1.5 font-normal text-gray-400">
                (min {JUSTIFICATION_MIN} caractères)
              </span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={`Pourquoi ${action} cette ligne ? Tracé dans le journal de sécurité.`}
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={remaining === 0 ? 'text-emerald-600' : 'text-gray-400'}>
                {remaining === 0
                  ? '✓ Justification valide'
                  : `${remaining} caractère${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}
              </span>
              <span className="text-gray-400">
                {justification.trim().length}/{JUSTIFICATION_MIN}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 text-sm"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className={`flex-1 text-white text-sm disabled:opacity-50 ${
              nextValue
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLoading ? 'Envoi…' : `Confirmer — ${actionMaj}`}
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}

function typeLivreurLabel(type: TypeLivreur | null): string {
  switch (type) {
    case 'INDEPENDANT':
      return 'Indépendant';
    case 'JOURNALIER':
      return 'Journalier';
    case 'SUPERVISEUR_LIVREUR':
      return 'Superviseur-livreur';
    default:
      return 'À catégoriser';
  }
}
