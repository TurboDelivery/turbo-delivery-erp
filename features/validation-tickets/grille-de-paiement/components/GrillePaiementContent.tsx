'use client';

import { CalendarDays } from 'lucide-react';
import { Pagination } from '@heroui/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useGrillePaiement from '../hooks/use-grille-paiement';
import GrillePaiementSkeleton from './GrillePaiementSkeleton';
import GrillePaiementBanner from './GrillePaiementBanner';
import GrillePaiementStats from './GrillePaiementStats';
import GrillePaiementTable from './GrillePaiementTable';
import GrillePaiementDetailModal from './GrillePaiementDetailModal';
import GrillePaiementSubmitFooter from './GrillePaiementSubmitFooter';
import GrillePaiementExportButton from './GrillePaiementExportButton';
import SoumettreConfirmModal from './SoumettreConfirmModal';
import ValiderLigneConfirmModal from './ValiderLigneConfirmModal';

export default function GrillePaiementContent() {
  const {
    grille,
    lignes,
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
    updateWave,
    waveManquants,
    page,
    setPage,
    totalPages,
    selectedLigne,
    openDetail,
    closeDetail,
    confirmOpen,
    closeConfirm,
    commentaire,
    setCommentaire,
    handleConfirmerSoumission,
    soumis,
    ligneAValider,
    handleValiderLigne,
    handleConfirmerValidation,
    closeConfirmValidation,
    isValidating,
  } = useGrillePaiement();

  if (isLoading) return <GrillePaiementSkeleton />;

  if (!grille) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
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
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-red-500">
            Grille de paiement —{' '}
            <span className="text-red-500 font-bold">{grille.code}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Génération automatique depuis les tickets verrouillés · Cliquez une ligne pour voir le détail.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <GrillePaiementExportButton
            creneauId={selectedCreneauId ?? undefined}
            grilleCode={grille.code}
            totalItems={grille.pagination.totalElements}
          />

          <Select
            value={selectedCreneauId ?? '__actif__'}
            onValueChange={(v) => setSelectedCreneauId(v === '__actif__' ? undefined : v)}
            disabled={isLoadingCreneaux}
          >
            <SelectTrigger className="w-full sm:w-72 gap-2 text-sm font-medium">
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
      </div>

      <GrillePaiementBanner grille={grille} soumis={soumis} />

      <GrillePaiementStats stats={grille.stats} />

      {!soumis && (
        <>
          <GrillePaiementTable
            lignes={lignes}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onToggle={toggleCheck}
            onToggleAll={toggleAll}
            onRowClick={openDetail}
            onUpdateWave={updateWave}
            onValiderLigne={handleValiderLigne}
            waveManquants={waveManquants}
          />

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                total={totalPages}
                page={page + 1}
                onChange={(p) => setPage(p - 1)}
                color="primary"
                showControls
              />
            </div>
          )}

          <GrillePaiementSubmitFooter
            canSoumettre={canSoumettre}
            isSoumettant={isSoumettant}
            onSoumettre={handleSoumettre}
          />
        </>
      )}

      <GrillePaiementDetailModal
        ligne={selectedLigne}
        creneauCode={grille.code}
        open={!!selectedLigne}
        onClose={closeDetail}
      />

      <SoumettreConfirmModal
        open={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirmerSoumission}
        isLoading={isSoumettant}
        totaux={{
          livreurs: grille.stats.totalLivreurs,
          tickets: grille.stats.totalTickets,
          net: grille.stats.totalNet,
        }}
        commentaire={commentaire}
        onCommentaireChange={setCommentaire}
      />

      <ValiderLigneConfirmModal
        open={!!ligneAValider}
        ligne={ligneAValider}
        isLoading={isValidating}
        onClose={closeConfirmValidation}
        onConfirm={handleConfirmerValidation}
      />
    </div>
  );
}
