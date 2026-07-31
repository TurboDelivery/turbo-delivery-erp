'use client';

import { IEmployeEvenement } from '@/features/personnel/types/personnel-historisation.types';
import {
  COULEUR_PASTILLE_EVENEMENT,
  formaterDate,
  natureEvenement,
} from '@/features/personnel/utils/personnel-historisation.utils';

/**
 * Parcours de l'agent, du plus récent au plus ancien : pastille verte pour une entrée,
 * rouge pour une sortie, bleue pour un basculement. Le backend sert déjà la liste dans cet
 * ordre ; on ne la retrie pas pour ne pas contredire son horodatage de saisie.
 */
export function ParcoursTimeline({ evenements }: { evenements: IEmployeEvenement[] }) {
  if (!evenements || evenements.length === 0) {
    return <p className="text-xs text-default-400">Aucun événement enregistré pour cet agent.</p>;
  }

  return (
    <ol className="relative ml-1 border-l border-default-200 pl-4">
      {evenements.map((e) => {
        const nature = natureEvenement(e.typeEvenement);
        return (
          <li key={e.id} className="relative pb-4 last:pb-0">
            <span
              className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${COULEUR_PASTILLE_EVENEMENT[nature]}`}
            />
            <div className="font-mono text-[10.5px] uppercase text-default-400">
              {formaterDate(e.dateEffective ?? e.dateSaisie)}
            </div>
            <div className="text-sm font-semibold text-default-700">{e.typeLibelle ?? e.typeEvenement}</div>
            {e.motif ? <div className="text-xs text-default-500">{e.motif}</div> : null}
            {e.auteurNom ? <div className="text-[11px] text-default-400">par {e.auteurNom}</div> : null}
          </li>
        );
      })}
    </ol>
  );
}
