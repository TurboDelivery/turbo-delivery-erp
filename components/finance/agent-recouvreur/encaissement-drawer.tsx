'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import AjouterPaiementModal, { type IPaiement } from './ajouter-paiement-modal';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  agentNom?: string;
  onPaiementAjoute: (facture: IFactureAgent, paiements: IPaiement[]) => void;
}

export default function EncaissementModal({
  open,
  onClose,
  facture,
  agentNom = '',
  onPaiementAjoute,
}: Props) {
  const [paiements, setPaiements] = useState<IPaiement[]>([]);
  const [ajouterOpen, setAjouterOpen] = useState(false);
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setPaiements([]);
  }, [open, facture]);

  if (!mounted || !open || !facture) return null;

  // Inclure ce qui est déjà recouvré côté serveur (facture.montantRecouvre) +
  // les paiements ajoutés dans cette session
  const alreadyOnServer = facture.montantRecouvre ?? 0;
  const montantRecouvre = alreadyOnServer + paiements.reduce((acc, p) => acc + p.montant, 0);
  const montantRestant = Math.max(0, facture.montant - montantRecouvre);
  const progression =
    facture.montant > 0
      ? Math.min(100, Math.round((montantRecouvre / facture.montant) * 100))
      : 0;

  function handlePaiement(p: Omit<IPaiement, 'id'>) {
    const nouveau: IPaiement = { ...p, id: crypto.randomUUID() };
    const updated = [...paiements, nouveau];
    setPaiements(updated);
    setAjouterOpen(false);
    onPaiementAjoute(facture!, updated);
  }

  return (
    <>
      {createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center${ajouterOpen ? ' hidden' : ''}`}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] mx-4 bg-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Encaissement</p>
                  <p className="text-xs text-muted">{facture.numero}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Informations générales */}
              <div className="rounded-xl border border-separator bg-surface-secondary p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Informations générales</p>
                  <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-xs font-medium">
                    • {facture.statut}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted mb-0.5">Partner</p>
                    <p className="font-medium text-foreground">{facture.partenaire}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {agentNom.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-0.5">Agent recouvreur</p>
                      <p className="font-medium text-foreground">{agentNom || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">Montant total</p>
                    <p className="font-semibold text-foreground">{formatMontant(facture.montant)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">Cycle de paiement</p>
                    <p className="font-medium text-foreground">{facture.cycle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">Date d&apos;émission</p>
                    <p className="font-medium text-foreground">
                      {facture.emission !== '—' ? facture.emission : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">Base dépôt partner</p>
                    <p className="font-medium text-muted">
                      {facture.depotPartenaire?.date ?? 'jj/mm/aaaa'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progression */}
              <div className="rounded-xl bg-surface-secondary border border-separator p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Progression du recouvrement</p>
                  <p
                    className={`text-sm font-bold ${
                      progression === 100
                        ? 'text-green-600'
                        : progression > 0
                        ? 'text-blue-600'
                        : 'text-muted'
                    }`}
                  >
                    {progression}%
                  </p>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-tertiary">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progression}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-muted">Montant recouvré</p>
                    <p className="font-semibold text-foreground">{formatMontant(montantRecouvre)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted">Montant restant</p>
                    <p className="font-semibold text-red-500">{formatMontant(montantRestant)}</p>
                  </div>
                </div>
              </div>

              {/* Paiements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Paiements ({paiements.length})</p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                    onClick={() => setAjouterOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter paiement
                  </Button>
                </div>
                {paiements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted rounded-xl border border-dashed border-separator">
                    <DollarSign className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Aucun paiement enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paiements.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-separator bg-surface px-4 py-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground">{p.type}</p>
                          <p className="text-xs text-muted">{p.date}</p>
                          {p.remarque && (
                            <p className="text-xs text-muted mt-0.5 italic">{p.remarque}</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-green-600">{formatMontant(p.montant)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>,
        portalRef.current!,
      )}

      <AjouterPaiementModal
        open={ajouterOpen}
        onClose={() => setAjouterOpen(false)}
        facture={facture}
        montantDejaRecouvre={montantRecouvre}
        onConfirm={handlePaiement}
      />
    </>
  );
}
