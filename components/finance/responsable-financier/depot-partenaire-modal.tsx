'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2 } from 'lucide-react';
import { Skeleton } from '@heroui/react';
import { Button } from '@/components/ui/button';
import type { IFactureRF } from './responsable-financier-columns';
import { useAgentsRecouvrementQuery } from '@/features/responsable-financier';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, date: string, agentId: string) => void;
}

export default function DepotPartenaireModal({ open, onClose, facture, onConfirm }: Props) {
  const [date, setDate] = useState('');
  const [agentId, setAgentId] = useState('');
  const portalRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  const { data: agents = [], isLoading: agentsLoading } = useAgentsRecouvrementQuery();

  useEffect(() => {
    portalRef.current = document.getElementById('modal-portal') ?? document.body;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) { setDate(''); setAgentId(''); }
  }, [open]);

  // Pre-select first agent when agents load
  useEffect(() => {
    if (agents.length > 0 && !agentId) setAgentId(agents[0].id);
  }, [agents, agentId]);

  if (!open || !facture || !mounted) return null;

  const canSubmit = date.trim() && agentId;

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
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Dépôt partenaire</h2>
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
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              Date de dépôt <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              Agent <span className="text-red-500">*</span>
            </label>
            {agentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAgentId(a.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-colors ${
                      agentId === a.id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                      {a.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.nom}</p>
                      <p className="text-xs text-gray-400">{a.role}</p>
                    </div>
                    {agentId === a.id && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Annuler
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => { onConfirm(facture, date.trim(), agentId); onClose(); }}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm disabled:opacity-50"
          >
            Enregistrer le dépôt
          </Button>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
