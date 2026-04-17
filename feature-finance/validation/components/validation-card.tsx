'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, Pencil, X, Download } from 'lucide-react';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { fmtDate } from './validation.constants';
import { StatusBadge, TypeBadge } from './validation-badges';
import { WorkflowStepper } from './workflow-stepper';
import { Can } from '@/components/auth/Can';
import { createUrlFile } from '@/utils/createUrlFile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ValidationCardProps {
  depense: IDepense;
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit?: () => void;
  acceptLabel: string;
  canAct: boolean;
  isDGA: boolean;
  isPending: boolean;
}

export function ValidationCard({ depense, current, total, onPrev, onNext, onAccept, onReject, onEdit, acceptLabel, canAct, isDGA, isPending }: ValidationCardProps) {
  const [showJustificatif, setShowJustificatif] = useState(false);

  return (
    <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">{acceptLabel === 'Viser' ? 'Validation DGA' : acceptLabel === 'Approuver' ? 'Approbation DG' : 'Décaissement Comptable'}</h2>
          <p className="text-sm text-gray-400">
            Dépense {current + 1} sur {total}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={current === 0} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} disabled={current === total - 1} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-gray-500">{fmtDate(depense.dateDepense)}</span>
          </div>
          <span className="text-xl font-bold text-[#E8541E]">{formatCFA(depense.montant)}</span>
        </div>

        <p className="mb-0.5 font-semibold text-gray-900">{depense.libelle}</p>
        <p className="mb-3 text-sm text-blue-500">{depense.categorie?.nomCategorie}</p>

        <WorkflowStepper statut={depense.statut} />

        <div className="mt-2 grid grid-cols-2 rounded-lg bg-gray-50 p-3">
          <div>
            <p className="text-xs text-gray-400">Créé par</p>
            <p className="text-sm font-medium text-gray-700">Comptable</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Date de création</p>
            <p className="text-sm font-medium text-gray-700">{fmtDate(depense.createdAt ?? depense.dateDepense)}</p>
          </div>
          {depense.justificatif && (
            <div
              onClick={() => setShowJustificatif(true)}
              className="col-span-2 mt-2 flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer hover:text-gray-800">
              <FileText className="h-4 w-4" />
              <span>Voir le justificatif</span>
            </div>
          )}
        </div>
      </div>

      {/* Dialog justificatif */}
      <Dialog open={showJustificatif} onOpenChange={setShowJustificatif}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Justificatif — {depense.libelle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={createUrlFile(depense.justificatif!, 'backend')}
                alt="Justificatif"
                className="max-h-[60vh] w-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <a
                href={createUrlFile(depense.justificatif!, 'backend')}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden w-full items-center justify-center gap-2 py-8 text-sm text-blue-600 hover:underline"
              >
                <Download className="h-4 w-4" />
                Ouvrir le fichier
              </a>
            </div>
            <a
              href={createUrlFile(depense.justificatif!, 'backend')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      {canAct ? (
        isDGA ? (
          <div className={`grid ${onEdit ? 'grid-cols-3' : 'grid-cols-2'} border-t border-gray-200`}>
            <Can I="rejeter-dga" a="Depense">
              <button
                onClick={() => onReject(depense.id)}
                disabled={isPending}
                className="flex items-center justify-center gap-1.5 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-gray-200 transition-colors"
              >
                <X className="h-4 w-4" /> Rejeter
              </button>
            </Can>
            {onEdit && (
              <Can I="update" a="Depense">
                <button
                  onClick={onEdit}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 py-4 text-sm font-medium text-orange-500 hover:bg-orange-50 disabled:opacity-50 border-r border-gray-200 transition-colors"
                >
                  <Pencil className="h-4 w-4" /> Modifier
                </button>
              </Can>
            )}
            <Can I="valider-dga" a="Depense">
              <button
                onClick={() => onAccept(depense.id)}
                disabled={isPending}
                className="flex items-center justify-center gap-1.5 rounded-br-xl bg-green-500 py-4 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" /> Viser
              </button>
            </Can>
          </div>
        ) : (
          // Comptable / DG : 2 actions
          <div className="grid grid-cols-2 border-t border-gray-200">
            <button
              onClick={() => onReject(depense.id)}
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-gray-200 transition-colors"
            >
              <X className="h-4 w-4" /> Rejeter
            </button>
            <button
              onClick={() => onAccept(depense.id)}
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-br-xl bg-green-500 py-4 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" /> {acceptLabel}
            </button>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-b-xl border-t border-gray-100 py-3 text-sm text-gray-400">
          <StatusBadge statut={depense.statut} />
        </div>
      )}
    </div>
  );
}
