'use client';

import { AlertTriangle, CalendarDays, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useGrillePaiement from '../hooks/use-grille-paiement';
import GrillePaiementBanner from './GrillePaiementBanner';
import GrillePaiementStats from './GrillePaiementStats';
import GrillePaiementTable from './GrillePaiementTable';
import GrillePaiementDetailModal from './GrillePaiementDetailModal';
import SoumettreConfirmModal from './SoumettreConfirmModal';

export default function GrillePaiementContent() {
  const {
    grille,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    checkedIds,
    toggleCheck,
    allChecked,
    toggleAll,
    canSoumettre,
    isSoumettant,
    handleSoumettre,
    totaux,
    selectedLigne,
    openDetail,
    closeDetail,
    confirmOpen,
    closeConfirm,
    commentaire,
    setCommentaire,
    handleConfirmerSoumission,
    soumis,
  } = useGrillePaiement();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 flex-1 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!grille) {
    return (
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Grille de paiement</h1>
          <p className="text-sm text-gray-400 mt-1">
            Génération automatique depuis les tickets verrouillés.
          </p>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-24">
          <p className="text-sm text-gray-400">Aucun créneau verrouillé disponible pour la grille de paiement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className=''>
          <h1 className="text-2xl font-bold text-red-500 ">
            Grille de paiement —{' '}
            <span className="text-red-500 font-bold">{grille.code}</span>
          </h1>
          <p className="text-md text-gray-400 mt-0.5">
            Génération automatique depuis les tickets verrouillés · Cliquez une ligne pour voir le
            détail.
          </p>
        </div>

        {/* Créneau selector */}
        <Select
          value={selectedCreneauId ?? '__actif__'}
          onValueChange={(v) => setSelectedCreneauId(v === '__actif__' ? undefined : v)}
          disabled={isLoadingCreneaux}
        >
          <SelectTrigger className="w-72 gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
            <SelectValue placeholder="Choisir un créneau…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__actif__">Créneau actif</SelectItem>
            {creneaux.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Créneau banner */}
      <GrillePaiementBanner grille={grille} soumis={soumis} />

      {/* Stats */}
      <GrillePaiementStats stats={grille.stats} />

      {/* Table + footer — masqués après soumission */}
      {!soumis && (
        <>
          <GrillePaiementTable
            lignes={grille.lignes}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onToggle={toggleCheck}
            onToggleAll={toggleAll}
            onRowClick={openDetail}
            totaux={totaux}
            waveManquants={grille.stats.waveManquants}
          />

          <div className="flex items-center justify-between shadow-sm ring-1 ring-gray-200 rounded-xl bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Cochez chaque ligne après contrôle pour activer la soumission.</span>
            </div>
            <Button
              onClick={handleSoumettre}
              disabled={!canSoumettre || isSoumettant}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Soumettre au DGA
            </Button>
          </div>
        </>
      )}

      {/* Detail modal */}
      <GrillePaiementDetailModal
        ligne={selectedLigne}
        creneauCode={grille.code}
        open={!!selectedLigne}
        onClose={closeDetail}
      />

      {/* Confirm submit modal */}
      <SoumettreConfirmModal
        open={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirmerSoumission}
        isLoading={isSoumettant}
        totaux={{
          livreurs: grille.stats.totalLivreurs,
          tickets: totaux.tickets,
          net: totaux.net,
        }}
        commentaire={commentaire}
        onCommentaireChange={setCommentaire}
      />
    </div>
  );
}
