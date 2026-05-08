import { FileText, Clock, CheckCircle2, Receipt, TrendingUp } from 'lucide-react';
import { formatCfa } from '@/utils/format.utils';
import { StatCard } from './stat-card';
import { Role } from './validation.constants';
interface IChargeTypeStats {
  comptable: { total: number; aDecaisser: number; decaisse: number };
  dga: { enAttente: number; montant: number };
  dg: { enAttente: number; approuvees: number; montant: number };
}

export function ValidationStats({ role, stats }: { role: Role; stats: IChargeTypeStats }) {
  if (role === 'comptable') return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard icon={<FileText     className="h-5 w-5 text-blue-600"   />} iconBg="bg-blue-50"   label="Dépenses totales"   value={stats.comptable.total} />
      <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600"  />} iconBg="bg-green-50"  label="À décaisser"         value={stats.comptable.aDecaisser} />
      <StatCard icon={<Receipt      className="h-5 w-5 text-orange-600" />} iconBg="bg-orange-50" label="Décaissé ce mois"    value={(stats.comptable.decaisse)} isText />
    </div>
  );

  if (role === 'dga') return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatCard icon={<Clock      className="h-5 w-5 text-yellow-600" />} iconBg="bg-yellow-50" label="En attente"         value={stats.dga.enAttente} />
      <StatCard icon={<TrendingUp className="h-5 w-5 text-orange-600" />} iconBg="bg-orange-50" label="Montant en attente" value={formatCfa(stats.dga.montant)} isText />
    </div>
  );

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard icon={<Clock        className="h-5 w-5 text-yellow-600" />} iconBg="bg-yellow-50" label="En attente DG"      value={stats.dg.enAttente} />
      <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600"  />} iconBg="bg-green-50"  label="Approuvées"         value={stats.dg.approuvees} />
      <StatCard icon={<TrendingUp   className="h-5 w-5 text-orange-600" />} iconBg="bg-orange-50" label="Montant en attente" value={formatCfa(stats.dg.montant)} isText />
    </div>
  );
}
