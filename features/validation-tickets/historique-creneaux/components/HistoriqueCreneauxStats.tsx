import type { IHistoriqueCreneauxStats } from '../types/historique-creneaux.type';

interface Props {
  stats: IHistoriqueCreneauxStats;
}

export default function HistoriqueCreneauxStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Créneaux au total</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Créneaux payés</p>
        <p className="mt-2 text-3xl font-bold text-green-500">{stats.payes}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">En régularisation</p>
        <p className="mt-2 text-3xl font-bold text-amber-500">{stats.enRegularisation}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Rejets</p>
        <p className="mt-2 text-3xl font-bold text-red-500">{stats.rejets}</p>
      </div>
    </div>
  );
}
