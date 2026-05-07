'use client';

import { CheckCircle2, Eye, RotateCcw, Send, Star, Ticket, TrendingUp, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useVisaDga from '../hooks/use-visa-dga';
import VisaDgaChaineValidation from './VisaDgaChaineValidation';
import VisaDgaRejetModal from './VisaDgaRejetModal';
import VisaDgaViserModal from './VisaDgaViserModal';
import { IVisaDgaCreneau } from '../types/visa-dga.type';
import { formatMontantCompact } from '@/utils/format.utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

interface StatMiniProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}

function StatMini({ label, value, sub, icon: Icon, highlight }: StatMiniProps) {
  return (
    <div className="flex flex-col  ">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span
        className={[
          'text-base sm:text-xl font-bold break-words',
          highlight ? 'text-green-600' : 'text-gray-900',
        ].join(' ')}
      >
        {value}
        {sub && <span className="ml-1 text-sm font-medium text-gray-500">{sub}</span>}
      </span>
    </div>
  );
}

interface LivreurRowProps {
  nom: string;
  tickets: number;
  numeroWave: string;
  netAPayer: number;
  bonus: boolean;
}

function LivreurRow({ nom, tickets, numeroWave, netAPayer, bonus }: LivreurRowProps) {
  return (
    <div className="flex items-center gap-3 justify-between py-2.5 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 truncate">{nom}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {tickets} tickets · {numeroWave}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {bonus && (
          <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            BONUS
          </span>
        )}
        <span className="text-sm font-bold text-green-600">
          {netAPayer.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
    </div>
  );
}

function StatutBadge({ statut }: { statut: IVisaDgaCreneau['statut'] }) {
  const map: Record<IVisaDgaCreneau['statut'], { label: string; className: string }> = {
    SOUMIS_DGA: { label: 'SOUMIS DGA', className: 'bg-amber-500 text-white' },
    EN_ATTENTE:  { label: 'EN ATTENTE', className: 'bg-gray-200 text-gray-600' },
    VISE:        { label: 'VISÉ',       className: 'bg-green-500 text-white' },
    REJETE:      { label: 'REJETÉ',     className: 'bg-red-500 text-white' },
  };
  const { label, className } = map[statut];
  return (
    <span className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}

export default function VisaDgaContent() {
  const {
    creneau,
    isLoading,
    isVisant,
    isRejetant,
    vise,
    rejetOpen,
    viserOpen,
    motif,
    setMotif,
    openRejet,
    closeRejet,
    openViser,
    closeViser,
    handleViser,
    handleRejeter,
    handleVoirGrille,
  } = useVisaDga();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Skeleton className="h-8 w-72" />
        <div className="flex flex-col gap-5 lg:flex-row">
          <Skeleton className="h-96 flex-1 rounded-xl" />
          <Skeleton className="h-48 lg:h-96 lg:w-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!creneau) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-red-500">Visa DGA</h1>
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-24">
          <p className="text-sm text-gray-400">Aucun dossier en attente de visa DGA.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-red-500">
            Visa DGA —{' '}
            <span className="text-red-500">{creneau.code}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatDate(creneau.debut)} → {formatDate(creneau.fin)}
          </p>
        </div>
        <StatutBadge statut={vise ? 'VISE' : creneau.statut} />
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Left — Récapitulatif + liste livreurs */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {/* Section title */}
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
              Récapitulatif consolidé
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 border-b border-gray-100 pb-5 mb-5">
              <StatMini label="Livreurs"    value={creneau.stats.totalLivreurs}               icon={Users}      />
              <StatMini label="Tickets"     value={creneau.stats.totalTickets}                icon={Ticket}     />
              <StatMini label="Total Brut"  value={formatMontantCompact(creneau.stats.totalBrut)}    sub="FCFA" icon={Wallet}     />
              <StatMini label="Total Net"   value={formatMontantCompact(creneau.stats.totalNet)}     sub="FCFA" icon={TrendingUp} highlight />
            </div>

            {/* Top livreurs */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white mb-2">
              Top livreurs
            </p>
            <div className=''>
              {creneau.livreurs.map((l) => (
                <LivreurRow
                  key={l.id}
                  nom={l.nom}
                  tickets={l.tickets}
                  numeroWave={l.numeroWave}
                  netAPayer={l.netAPayer}
                  bonus={l.bonus}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {!vise && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={handleVoirGrille}
              >
                <Eye className="h-4 w-4" />
                Voir grille complète
              </Button>

              <Button
                variant="outline"
                className="gap-2 text-gray-600"
                onClick={openRejet}
                disabled={isRejetant}
              >
                <RotateCcw className="h-4 w-4" />
                Rejeter et renvoyer
              </Button>

              <Button
                variant="default"
                className="sm:ml-auto bg-red-600 hover:bg-red-700 text-white gap-2"
                onClick={openViser}
                disabled={isVisant}
              >
                <Send className="h-4 w-4" />
                Viser et transmettre au PDG
              </Button>
            </div>
          )}

          {vise && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-sm font-medium text-green-700">
                Visa DGA apposé — dossier transmis au PDG pour approbation finale.
              </p>
            </div>
          )}
        </div>

        {/* Right — Chaîne de validation */}
        <VisaDgaChaineValidation etapes={creneau.chaineValidation} />
      </div>

      {/* Modal viser */}
      <VisaDgaViserModal
        open={viserOpen}
        onClose={closeViser}
        onConfirm={handleViser}
        isLoading={isVisant}
        codeCreneau={creneau.code}
        totaux={{
          livreurs: creneau.stats.totalLivreurs,
          tickets: creneau.stats.totalTickets,
          net: creneau.stats.totalNet,
        }}
      />

      {/* Modal rejet */}
      <VisaDgaRejetModal
        open={rejetOpen}
        onClose={closeRejet}
        onConfirm={handleRejeter}
        isLoading={isRejetant}
        motif={motif}
        onMotifChange={setMotif}
        totaux={{
          livreurs: creneau.stats.totalLivreurs,
          tickets: creneau.stats.totalTickets,
          net: creneau.stats.totalNet,
        }}
      />
    </div>
  );
}
