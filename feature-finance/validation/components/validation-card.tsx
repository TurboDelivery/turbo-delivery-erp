'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, Pencil, X } from 'lucide-react';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { fmtDate } from './validation.constants';
import { StatusBadge, TypeBadge } from './validation-badges';
import { WorkflowStepper } from './workflow-stepper';
import { ModifierForm } from './modifier-form';

interface ValidationCardProps {
  depense: IDepense;
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onModifier: (id: string, updates: Partial<IDepense>) => void;
  acceptLabel: string;
  canAct: boolean;
  isDGA: boolean;
  isPending: boolean;
}

export function ValidationCard({ depense, current, total, onPrev, onNext, onAccept, onReject, onModifier, acceptLabel, canAct, isDGA, isPending }: ValidationCardProps) {
  const [showEdit, setShowEdit] = useState(false);

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
          <div className="col-span-2 mt-2 flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer hover:text-gray-800">
            <FileText className="h-4 w-4" />
            <span>Voir le justificatif en grand</span>
          </div>
        </div>
      </div>

      {/* Formulaire modifier inline */}
      {showEdit && (
        <ModifierForm
          depense={depense}
          onSave={(updates) => {
            onModifier(depense.id, updates);
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      )}

      {/* Actions */}
      {canAct ? (
        isDGA ? (
          // DGA : 3 actions — Rejeter | Modifier | Viser
          <div className="grid grid-cols-3 border-t border-gray-200">
            <button
              onClick={() => {
                onReject(depense.id);
                setShowEdit(false);
              }}
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-gray-200 transition-colors"
            >
              <X className="h-4 w-4" /> Rejeter
            </button>
            <button
              onClick={() => setShowEdit((v) => !v)}
              disabled={isPending}
              className={`flex items-center justify-center gap-1.5 py-4 text-sm font-medium transition-colors border-r border-gray-200 ${
                showEdit ? 'bg-orange-50 text-orange-600' : 'text-orange-500 hover:bg-orange-50'
              } disabled:opacity-50`}
            >
              <Pencil className="h-4 w-4" /> Modifier
            </button>
            <button
              onClick={() => {
                onAccept(depense.id);
                setShowEdit(false);
              }}
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-br-xl bg-green-500 py-4 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" /> Viser
            </button>
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
