'use client';

import { Pagination } from '@heroui/react';
import useGrillePaiement from '../hooks/use-grille-paiement';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
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
            totalItems={grille.lignes.totalElements}
          />

          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={selectedCreneauId}
            onSelectCreneau={setSelectedCreneauId}
            disabled={isLoadingCreneaux}
          />
        </div>
      </div>

      <GrillePaiementBanner grille={grille} soumis={soumis} />

      <GrillePaiementStats stats={grille.stats} />

      {!soumis && (
        <>
          <GrillePaiementTable
            lignes={lignes}
            onRowClick={openDetail}
            onUpdateWave={updateWave}
            onValiderLigne={handleValiderLigne}
            waveManquants={waveManquants}
            creneauDebut={new Date(grille.debut)}
            creneauFin={new Date(grille.fin)}
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
