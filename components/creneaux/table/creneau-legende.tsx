'use client';

import { CreneauStatutJour } from '@/features/creneaux/types/creneau.types';
import { getStatutDotColor, getStatutLabel } from '@/features/creneaux/utils/creneau.utils';

const STATUTS = [
  CreneauStatutJour.PRESENT,
  CreneauStatutJour.ABSENT,
  CreneauStatutJour.RETARD,
  CreneauStatutJour.JUSTIFIE,
  CreneauStatutJour.NON_INSCRIT,
];

export function CreneauLegende() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <span className="font-medium text-default-600">Legende :</span>
      {STATUTS.map((statut) => (
        <div key={statut} className="flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-full ${getStatutDotColor(statut)}`} />
          <span className="text-default-500">{getStatutLabel(statut)}</span>
        </div>
      ))}
    </div>
  );
}
