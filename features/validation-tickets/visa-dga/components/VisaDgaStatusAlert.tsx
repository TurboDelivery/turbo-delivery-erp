import { CheckCircle2, Clock } from 'lucide-react';
import { StatutVisaDga } from '../types/visa-dga.type';

interface Props {
  statut: StatutVisaDga;
  vise: boolean;
}

export default function VisaDgaStatusAlert({ statut, vise }: Props) {
  if (vise || statut === 'VISE') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-700">
          Visa DGA apposé — dossier transmis au PDG pour approbation finale.
        </p>
      </div>
    );
  }

  if (statut === 'EN_ATTENTE' || statut === 'CALCUL_EN_COURS') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Clock className="h-5 w-5 text-blue-400 shrink-0" />
        <p className="text-sm font-medium text-blue-700">
          {statut === 'EN_ATTENTE'
            ? 'Dossier en attente — la comptabilité doit soumettre la grille au DGA avant que vous puissiez agir.'
            : 'Calcul de la grille en cours — en attente de soumission au DGA par la comptabilité.'}
        </p>
      </div>
    );
  }

  return null;
}
