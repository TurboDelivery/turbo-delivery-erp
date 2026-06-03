'use client';

import { Skeleton } from '@/components/ui/skeleton';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import { Ticket, TrendingUp, Users, Wallet } from 'lucide-react';
import useVisaDga from '../hooks/use-visa-dga';
import StatMini from './StatMini';
import LivreurRow from './LivreurRow';
import VisaDgaStatutBadge from './VisaDgaStatutBadge';
import VisaDgaActionBar from './VisaDgaActionBar';
import VisaDgaStatusAlert from './VisaDgaStatusAlert';
import VisaDgaChaineValidation from './VisaDgaChaineValidation';
import VisaDgaRejetModal from './VisaDgaRejetModal';
import VisaDgaViserModal from './VisaDgaViserModal';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function VisaDgaContent() {
  const {
    creneau,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
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
            Visa DGA — <span className="text-red-500">{creneau.code}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatDate(creneau.debut)} → {formatDate(creneau.fin)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={selectedCreneauId}
            onSelectCreneau={setSelectedCreneauId}
            disabled={isLoadingCreneaux}
          />
          <VisaDgaStatutBadge statut={vise ? 'VISE' : creneau.statut} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Left — Récapitulatif + liste livreurs */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
              Récapitulatif consolidé
            </p>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 border-b border-gray-100 pb-5 mb-5">
              <StatMini label="Livreurs"   value={creneau.stats.totalLivreurs}                          icon={Users}      />
              <StatMini label="Tickets"    value={creneau.stats.totalTickets}                           icon={Ticket}     />
              <StatMini label="Total Brut" value={creneau.stats.totalBrut.toLocaleString('fr-FR')} sub="FCFA" icon={Wallet}     />
              <StatMini label="Total à payer (Indép.)" value={(creneau.stats.totalAPayer ?? creneau.stats.totalNet).toLocaleString('fr-FR')} sub="FCFA" icon={TrendingUp} highlight />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Top livreurs
            </p>
            {creneau.livreurs.map((l) => (
              <LivreurRow key={l.id} {...l} />
            ))}
          </div>

          {!vise && creneau.statut === 'SOUMIS_DGA' && (
            <VisaDgaActionBar
              isVisant={isVisant}
              isRejetant={isRejetant}
              onVoirGrille={handleVoirGrille}
              onRejeter={openRejet}
              onViser={openViser}
            />
          )}

          <VisaDgaStatusAlert statut={creneau.statut} vise={vise} />
        </div>

        {/* Right — Chaîne de validation */}
        <VisaDgaChaineValidation etapes={creneau.chaineValidation} />
      </div>

      <VisaDgaViserModal
        open={viserOpen}
        onClose={closeViser}
        onConfirm={handleViser}
        isLoading={isVisant}
        codeCreneau={creneau.code}
        totaux={{
          livreurs: creneau.stats.nbIndependants ?? creneau.stats.totalLivreurs,
          tickets: creneau.stats.totalTickets,
          net: creneau.stats.totalAPayer ?? creneau.stats.totalNet,
        }}
      />

      <VisaDgaRejetModal
        open={rejetOpen}
        onClose={closeRejet}
        onConfirm={handleRejeter}
        isLoading={isRejetant}
        motif={motif}
        onMotifChange={setMotif}
        totaux={{
          livreurs: creneau.stats.nbIndependants ?? creneau.stats.totalLivreurs,
          tickets: creneau.stats.totalTickets,
          net: creneau.stats.totalAPayer ?? creneau.stats.totalNet,
        }}
      />
    </div>
  );
}
