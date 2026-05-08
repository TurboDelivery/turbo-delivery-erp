import { Phone, Ticket, TrendingUp, Users, Wallet } from 'lucide-react';
import { IGrillePaiementCreneau } from '../types/grille-paiement.type';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  className?: string;
}

function StatCard({ label, value, sub, icon: Icon, className }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white px-4 py-3 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase text-gray-500 leading-tight">{label}</span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
          <Icon className="h-3.5 w-3.5 text-red-500" />
        </div>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight break-words">
        {value}
        {sub && <span className="ml-1 text-xs sm:text-sm font-medium text-black">{sub}</span>}
      </p>
    </div>
  );
}

interface Props {
  stats: IGrillePaiementCreneau['stats'];
  totalTickets: number;
}

export default function GrillePaiementStats({ stats, totalTickets }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Livreurs" value={stats.totalLivreurs} icon={Users} />
      <StatCard label="Tickets" value={totalTickets} icon={Ticket} />
      <StatCard label="Total Brut" value={stats.totalBrut.toLocaleString('fr-FR')} sub="FCFA" icon={Wallet} />
      <StatCard label="Total Net" value={stats.totalNet.toLocaleString('fr-FR')} sub="FCFA" icon={TrendingUp} className="ring-1 ring-green-400" />
      <StatCard label="Wave manquants" value={stats.waveManquants} icon={Phone} className="ring-1 ring-red-600 col-span-2 sm:col-span-1" />
    </div>
  );
}
