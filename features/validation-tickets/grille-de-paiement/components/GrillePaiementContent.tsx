'use client';

import { useState } from 'react';
import { Button, Pagination } from '@heroui/react';
import { Lock, Settings } from 'lucide-react';
import useGrillePaiement from '../hooks/use-grille-paiement';
import { lotStatutLabel } from '../utils/lot-statut-label';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import CreneauxAdminModal from '@/features/creneaux/components/CreneauxAdminModal';
import GrillePaiementSkeleton from './GrillePaiementSkeleton';
import GrillePaiementBanner from './GrillePaiementBanner';
import GrillePaiementStats from './GrillePaiementStats';
import GrillePaiementTable from './GrillePaiementTable';
import GrillePaiementDetailModal from './GrillePaiementDetailModal';
import GrillePaiementSubmitFooter from './GrillePaiementSubmitFooter';
import GrillePaiementExportButton from './GrillePaiementExportButton';
import JustificationInclusionModal from './JustificationInclusionModal';
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
    isLotVerrouille,
    lotStatut,
    ligneAValider,
    handleValiderLigne,
    handleConfirmerValidation,
    closeConfirmValidation,
    isValidating,
    canEditInclusion,
    inclusionRequest,
    isModifyingInclusion,
    handleRequestToggleInclusion,
    handleConfirmerInclusion,
    closeInclusionRequest,
  } = useGrillePaiement();

  // V58 (2026-05-29) — Modale admin "Gérer les créneaux".
  const [creneauxAdminOpen, setCreneauxAdminOpen] = useState(false);

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

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap justify-end">
          {lotStatut && lotStatut !== 'EN_ATTENTE' && (
            <span
              className={
                lotStatut === 'REJETE'
                  ? 'inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
              }
            >
              <Lock className="h-3 w-3" />
              {lotStatutLabel(lotStatut)}
            </span>
          )}

          {/* V58 (2026-05-29) — Accès à la modale admin "Gérer les créneaux"
              pour masquer/réafficher des créneaux sans suppression. */}
          <Button
            size="sm"
            variant="bordered"
            startContent={<Settings size={14} />}
            onPress={() => setCreneauxAdminOpen(true)}
          >
            Gérer les créneaux
          </Button>

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

      <GrillePaiementBanner grille={grille} />

      <GrillePaiementStats stats={grille.stats} />

      <GrillePaiementTable
        lignes={lignes}
        onRowClick={openDetail}
        onUpdateWave={updateWave}
        onValiderLigne={handleValiderLigne}
        onToggleInclusion={handleRequestToggleInclusion}
        canEditInclusion={canEditInclusion}
        waveManquants={waveManquants}
        creneauDebut={new Date(grille.debut)}
        creneauFin={new Date(grille.fin)}
        readOnly={isLotVerrouille}
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

      {!isLotVerrouille && (
        <GrillePaiementSubmitFooter
          canSoumettre={canSoumettre}
          isSoumettant={isSoumettant}
          onSoumettre={handleSoumettre}
        />
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

      {/* V58 (2026-05-29) — Modale admin pour basculer la visibilité des créneaux. */}
      <CreneauxAdminModal
        open={creneauxAdminOpen}
        onClose={() => setCreneauxAdminOpen(false)}
      />

      {/* V54 (2026-05) — Modale justification override Comptable. */}
      <JustificationInclusionModal
        open={!!inclusionRequest}
        ligne={inclusionRequest?.ligne ?? null}
        nextValue={inclusionRequest?.nextValue ?? false}
        lotStatut={lotStatut}
        isLoading={isModifyingInclusion}
        onClose={closeInclusionRequest}
        onConfirm={handleConfirmerInclusion}
      />
    </div>
  );
}
