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
  /** Total SERVEUR de la file, quand il depasse les lignes chargees. */
  totalFile?: number;
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

export function ValidationCard({ depense, current, total, totalFile, onPrev, onNext, onAccept, onReject, onEdit, acceptLabel, canAct, isDGA, isPending }: ValidationCardProps) {
  const [showJustificatif, setShowJustificatif] = useState(false);

  return (
    <div className="rounded-b-xl border border-t-0 border-separator bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-separator px-5 py-4">
        <div>
          <h2 className="font-semibold text-foreground">{acceptLabel === 'Viser' ? 'Validation DGA' : acceptLabel === 'Approuver' ? 'Approbation DG' : 'Décaissement Comptable'}</h2>
          <p className="text-sm text-muted">
            Dépense {current + 1} sur {total}
            {typeof totalFile === 'number' && totalFile > total && (
              <span className="ml-1 text-muted">({totalFile} en attente au total)</span>
            )}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={current === 0} className="rounded p-1.5 hover:bg-surface-secondary disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} disabled={current === total - 1} className="rounded p-1.5 hover:bg-surface-secondary disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-muted">{fmtDate(depense.dateDepense)}</span>
          </div>
          <span className="text-xl font-bold text-warning-soft-foreground">{formatCFA(depense.montant)}</span>
        </div>

        <p className="mb-0.5 font-semibold text-foreground">{depense.libelle}</p>
        <p className="mb-3 text-sm text-blue-500">{depense.categorie?.nomCategorie}</p>

        <WorkflowStepper statut={depense.statut} />

        <div className="mt-2 grid grid-cols-2 rounded-lg bg-surface-secondary p-3">
          <div>
            <p className="text-xs text-muted">Créé par</p>
            <p className="text-sm font-medium text-foreground">Comptable</p>
          </div>
          <div>
            <p className="text-xs text-muted">Date de création</p>
            <p className="text-sm font-medium text-foreground">{fmtDate(depense.createdAt ?? depense.dateDepense)}</p>
          </div>
          {depense.justificatif && (
            <div
              onClick={() => setShowJustificatif(true)}
              className="col-span-2 mt-2 flex items-center gap-1.5 text-sm text-muted cursor-pointer hover:text-gray-800">
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
            <div className="overflow-hidden rounded-lg border border-separator bg-surface-secondary">
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-separator px-4 py-2 text-sm text-muted hover:bg-surface-secondary transition-colors"
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
          <div className={`grid ${onEdit ? 'grid-cols-3' : 'grid-cols-2'} border-t border-separator`}>
            <Can I="rejeter-dga" a="Depense">
              <button
                onClick={() => onReject(depense.id)}
                disabled={isPending}
                className="flex items-center justify-center gap-1.5 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-separator transition-colors"
              >
                <X className="h-4 w-4" /> Rejeter
              </button>
            </Can>
            {onEdit && (
              <Can I="update" a="Depense">
                <button
                  onClick={onEdit}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 py-4 text-sm font-medium text-orange-500 hover:bg-orange-50 disabled:opacity-50 border-r border-separator transition-colors"
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
          <div className="grid grid-cols-2 border-t border-separator">
            <button
              onClick={() => onReject(depense.id)}
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-separator transition-colors"
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
        <div className="flex items-center justify-center gap-2 rounded-b-xl border-t border-separator py-3 text-sm text-muted">
          <StatusBadge statut={depense.statut} />
        </div>
      )}
    </div>
  );
}
