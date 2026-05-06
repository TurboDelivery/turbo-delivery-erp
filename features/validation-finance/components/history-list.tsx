import { Receipt } from 'lucide-react';
import { IDepense } from '@/features/depenses/types/depense.type';
import { HistoryRow } from './history-row';

interface HistoryListProps {
  depenses: IDepense[];
}

export function HistoryList({ depenses }: HistoryListProps) {
  return (
    <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Receipt className="h-5 w-5 text-red-500" />
          Historique de toutes les dépenses
        </h2>
      </div>
      {depenses.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">Aucune dépense enregistrée</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {depenses.map((d) => (
            <HistoryRow key={d.id} depense={d} />
          ))}
        </div>
      )}
    </div>
  );
}
