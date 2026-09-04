'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/heroui';
import type { IFactureRF } from './responsable-financier-columns';
import { useAgentsRecouvrementQuery, type IAgentRecouvrement } from '@/features/responsable-financier';
import EtatErreur from '@/components/commons/EtatErreur';
import { formatMontant } from '@/utils/format.utils';

export type IAgent = IAgentRecouvrement;

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, agent: IAgent) => void;
}


export default function DemarrerRecouvrementDrawer({ open, onClose, facture, onConfirm }: Props) {
  const { data: agents = [], isLoading, isError, isFetching, refetch } = useAgentsRecouvrementQuery();
  const [selectedAgent, setSelectedAgent] = useState<IAgent | null>(null);

  // Reset à chaque ouverture / changement de facture : le COMPTABLE doit
  // explicitement choisir le recouvreur, pas hériter du premier de la liste ni
  // d'une sélection précédente. Le bouton "Démarrer" reste désactivé tant
  // qu'aucun agent n'est sélectionné.
  useEffect(() => {
    if (open) setSelectedAgent(null);
  }, [open, facture?.id]);

  function handleConfirm() {
    if (facture && selectedAgent) onConfirm(facture, selectedAgent);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-separator">
          <SheetTitle className="text-base font-semibold text-foreground">
            Démarrer le recouvrement
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <p className="text-sm text-muted">
            Assigner un agent recouvrement pour cette facture. L&apos;agent sera responsable de la
            récupération du paiement auprès du partenaire.
          </p>

          {/* Détails de la facture */}
          {facture && (
            <div className="rounded-xl border border-separator bg-surface-secondary p-4 space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Détails de la facture
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted mb-0.5">N° Facture</p>
                  <p className="font-medium text-foreground">{facture.numero}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">Partenaire</p>
                  <p className="font-medium text-foreground">{facture.partenaire}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">Montant</p>
                  <p className="font-semibold text-red-500">{formatMontant(facture.montant)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">Date d&apos;émission</p>
                  <p className="font-medium text-foreground">{facture.emission}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sélection agent */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sélectionner un agent recouvrement <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {/* sur echec la liste restait vide : le comptable croyait qu'aucun agent n'existait */}
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl w-full" />
                  ))
                : isError
                ? <EtatErreur quoi="les agents de recouvrement" onReessayer={() => refetch()} enCours={isFetching} />
                : agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'border-red-400 bg-red-50'
                      : 'border-separator bg-surface hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center shrink-0 text-xs font-bold text-muted">
                    {agent.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.nom}</p>
                    <p className="text-xs text-muted">{agent.role}</p>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-separator">
          <Button
            onClick={handleConfirm}
            disabled={!selectedAgent}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 disabled:opacity-50"
          >
            Démarrer le recouvrement
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
