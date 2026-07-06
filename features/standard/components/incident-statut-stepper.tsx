'use client';

import { Check } from 'lucide-react';

import { STATUT_LABEL, STATUT_ORDRE, StatutIncident } from '../types/standard.types';

const ETAPES: StatutIncident[] = ['RECU', 'EN_COURS', 'TRAITE', 'CLOTURE'];

/**
 * Frise horizontale de progression d'un incident (RG-24) :
 * Reçu → En cours → Traité → Clôturé. L'étape courante est mise en avant, les
 * précédentes cochées.
 */
export function IncidentStatutStepper({ statut }: { statut: StatutIncident }) {
  const courant = STATUT_ORDRE[statut];

  return (
    <div className="flex items-center">
      {ETAPES.map((etape, i) => {
        const rang = STATUT_ORDRE[etape];
        const fait = rang < courant;
        const actif = rang === courant;
        return (
          <div key={etape} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  actif
                    ? 'bg-primary text-white ring-4 ring-primary/15'
                    : fait
                      ? 'bg-primary/80 text-white'
                      : 'bg-default-100 text-default-400',
                ].join(' ')}
              >
                {fait ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-[11px] ${
                  actif ? 'font-semibold text-primary' : 'text-default-400'
                }`}
              >
                {STATUT_LABEL[etape]}
              </span>
            </div>
            {i < ETAPES.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 rounded ${rang < courant ? 'bg-primary/70' : 'bg-default-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
