import { Phone, Ticket, TrendingUp, Users, Wallet } from 'lucide-react';
import { IGrillePaiementCreneau } from '../types/grille-paiement.type';

function formatMontant(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('fr-FR');
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
className?: string;
}

function StatCard({ label, value, sub, icon: Icon,className }: StatCardProps) {
  return (
    <div className={`flex-1 rounded-xl border border-gray-200 bg-white px-5 py-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase  tracking-widest text-gray-500">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <Icon className={`h-4 w-4  text-red-500 ${className}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">
        {value}
        {sub && <span className="ml-1 text-sm font-medium text-black">{sub}</span>}
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
    <div className="flex gap-4">
      <StatCard label="Livreurs" value={stats.totalLivreurs} icon={Users} />
      <StatCard label="Tickets" value={totalTickets} icon={Ticket} />
      <StatCard label="Total Brut" value={formatMontant(stats.totalBrut)} sub="FCFA" icon={Wallet} />
      <StatCard label="Total Net" value={formatMontant(stats.totalNet)} sub="FCFA" icon={TrendingUp} className='ring-1 ring-green-400' />
      <StatCard label="Wave Manquants" value={stats.waveManquants} icon={Phone} className='ring-1 ring-red-600' />
    </div>
  );
}
