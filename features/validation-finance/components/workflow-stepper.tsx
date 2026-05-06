import { Check } from 'lucide-react';
import {
  S_REJETE_DGA, S_REJETE_DG, S_DECAISSE, S_VUE_DGA,
  S_APPROUVE, S_EN_ATTENTE_DG, S_VERIFIE_DGA,
} from './validation.constants';

const WORKFLOW_STEPS = [
  { label: 'Comptable', sub: 'Saisie' },
  { label: 'DGA',       sub: 'Validation' },
  { label: 'DG',        sub: 'Approbation' },
  { label: 'Paiement',  sub: 'Décaissement' },
];

function stepFromStatut(statut: string): number {
  if ([S_REJETE_DGA, S_REJETE_DG].includes(statut))              return -1;
  if ([S_DECAISSE, S_VUE_DGA].includes(statut))                  return 4;
  if (statut === S_APPROUVE)                                      return 3;
  if (statut === S_EN_ATTENTE_DG || statut === S_VERIFIE_DGA)    return 2;
  return 1;
}

export function WorkflowStepper({ statut }: { statut: string }) {
  const active = stepFromStatut(statut);
  return (
    <div className="flex items-center py-4">
      {WORKFLOW_STEPS.map((step, i) => {
        const done    = active > i;
        const current = active === i;
        const last    = i === WORKFLOW_STEPS.length - 1;
        return (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
                done    ? 'border-green-500 bg-green-500 text-white'
                : current ? 'border-blue-500  bg-white      text-blue-500'
                          : 'border-gray-200  bg-white      text-gray-400'
              }`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium ${done ? 'text-green-600' : current ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
              <span className="text-[10px] text-gray-400">{step.sub}</span>
            </div>
            {!last && <div className={`h-0.5 flex-1 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}
