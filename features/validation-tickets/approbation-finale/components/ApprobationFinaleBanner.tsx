import { ShieldCheck } from 'lucide-react';
import { formatDateHeure } from '../utils/approbation-finale.utils';

interface Props {
  visePar?: string;
  viseAt?: string;
  totalNet: number;
  totalLivreurs: number;
}

export default function ApprobationFinaleBanner({ visePar, viseAt, totalNet, totalLivreurs }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <ShieldCheck className="h-5 w-5 text-red-500" />
        </div>
        <div>
          {visePar && viseAt && (
            <p className="text-sm font-semibold text-green-700">
              Visé par {visePar} le {formatDateHeure(viseAt)}
            </p>
          )}
          <p className="text-sm text-gray-800 mt-1">
            Ce paiement a été vérifié et validé par{' '}
            <span className="font-semibold text-green-700">5 niveaux de contrôle</span>.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Saisie · V1 · V2 (Verrouillage) · Comptabilité · DGA.
          </p>
        </div>
      </div>

      <div className="text-left sm:text-right shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Montant total à virer (Indépendants)
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-0.5">
          {totalNet.toLocaleString('fr-FR')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          FCFA · {totalLivreurs} Turboys via Wave
        </p>
      </div>
    </div>
  );
}
