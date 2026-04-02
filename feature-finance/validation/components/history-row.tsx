import { Download, Eye } from 'lucide-react';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { fmtDate } from './validation.constants';
import { TypeBadge, StatusBadge } from './validation-badges';

export function HistoryRow({ depense }: { depense: IDepense }) {
  return (
    <div className="p-5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-gray-500">{fmtDate(depense.dateDepense)}</span>
          </div>
          <h3 className="mb-1 font-semibold text-gray-900">{depense.libelle}</h3>
          <p className="mb-3 text-sm text-gray-500">{depense.categorie?.nomCategorie}</p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-blue-600">{formatCFA(depense.montant)}</span>
            <StatusBadge statut={depense.statut} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {depense.description && (
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Justificatif</span>
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Détails</span>
          </button>
        </div>
      </div>
    </div>
  );
}
