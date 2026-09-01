'use client';

import { useState } from 'react';
import EtatErreur from '@/components/commons/EtatErreur';
import { Pagination } from '@/components/heroui';
import { Lock, LockKeyhole, LockKeyholeOpen, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ui/confirm-modal';
import useGrillePaiement from '../hooks/use-grille-paiement';
import { lotStatutLabel } from '../utils/lot-statut-label';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import GrillePaiementSkeleton from './GrillePaiementSkeleton';
import GrillePaiementBanner from './GrillePaiementBanner';
import GrillePaiementStats from './GrillePaiementStats';
import GrillePaiementTable from './GrillePaiementTable';
import GrillePaiementDetailModal from './GrillePaiementDetailModal';
import GrillePaiementSubmitFooter, { blocagesSoumission } from './GrillePaiementSubmitFooter';
import GrillePaiementExportButton from './GrillePaiementExportButton';
import JustificationInclusionModal from './JustificationInclusionModal';
import SoumettreConfirmModal from './SoumettreConfirmModal';
import ValiderLigneConfirmModal from './ValiderLigneConfirmModal';

export default function GrillePaiementContent() {
  const {
    grille,
    lignes,
    isLoading,
    isError,
    refetch,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    canSoumettre,
    isSoumettant,
    handleSoumettre,
    isValidantTout,
    handleToutValider,
    canCloturer,
    isCloturant,
    handleCloturerCreneau,
    updateWave,
    waveManquants,
    lignesAValider,
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
    canAnnulerCloture,
    isAnnulantCloture,
    handleAnnulerCloture,
    annulerClotureOpen,
    setAnnulerClotureOpen,
  } = useGrillePaiement();

  const [cloturerOpen, setCloturerOpen] = useState(false);
  const [motifReouverture, setMotifReouverture] = useState('');

  if (isLoading) return <GrillePaiementSkeleton />;
  // L'echec etait signale par une notification, qui disparait, pendant que l'ecran
  // affichait « Aucune ligne » : rien ne distinguait une grille vide d'une panne.
  if (isError) return <EtatErreur quoi="la grille de paiement" onReessayer={() => refetch()} />;

  if (!grille) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Grille de paiement</h1>
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
          <h1 className="text-2xl font-bold text-primary">
            Grille de paiement —{' '}
            <span className="text-primary font-bold">{grille.code}</span>
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

          {/* Clôture manuelle du créneau : visible tant qu'il n'est pas verrouillé.
              Après clôture, tout ticket saisi part en Régularisation. */}
          {canCloturer && (
            <Button
              onClick={() => setCloturerOpen(true)}
              disabled={isCloturant}
              className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
            >
              <LockKeyhole className="h-4 w-4" />
              {isCloturant ? 'Clôture…' : 'Clôturer le créneau'}
            </Button>
          )}

          {/* V137 — Annulation de la clôture, réservée à l'administrateur. Rend la
              semaine modifiable pour la compléter, avant de la re-clôturer. */}
          {canAnnulerCloture && (
            <Button
              onClick={() => setAnnulerClotureOpen(true)}
              disabled={isAnnulantCloture}
              variant="outline"
              className="flex items-center gap-2 border-amber-600 text-amber-700 hover:bg-amber-50 disabled:opacity-40"
            >
              <LockKeyholeOpen className="h-4 w-4" />
              {isAnnulantCloture ? 'Réouverture…' : 'Annuler la clôture'}
            </Button>
          )}

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

      {/* Lot calculé mais pas encore transmis au DGA : la soumission s'est arrêtée
          à l'étape 1 (CALCUL_EN_COURS), ou une modif d'inclusion a remis le lot en
          calcul. Rien ne le signalait → le comptable ne savait pas qu'il fallait
          re-cliquer « Soumettre au DGA ». On l'affiche clairement + action directe. */}
      {!isLotVerrouille && lotStatut === 'CALCUL_EN_COURS' && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Send className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Grille calculée — pas encore transmise au DGA</p>
              {canSoumettre ? (
                <p className="text-amber-700">
                  Le lot est prêt mais n&apos;a pas encore été soumis (ou une modification l&apos;a remis en
                  calcul). Cliquez « Soumettre au DGA » pour le transmettre — le DGA pourra alors le viser.
                </p>
              ) : (
                <p className="text-amber-700">
                  À finaliser avant de pouvoir soumettre : {blocagesSoumission(waveManquants, lignesAValider).join(' · ')}.
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleSoumettre}
            disabled={!canSoumettre || isSoumettant}
            className="shrink-0 gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {isSoumettant ? 'Envoi…' : 'Soumettre au DGA'}
          </Button>
        </div>
      )}

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
          waveManquants={waveManquants}
          lignesAValider={lignesAValider}
          onSoumettre={handleSoumettre}
          onToutValider={handleToutValider}
          isValidantTout={isValidantTout}
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
          // Soumission DGA : on présente le « Total à payer » (Indépendants
          // uniquement, V54) — pas le totalNet qui englobe journaliers +
          // superviseurs (payés via un autre circuit). Cohérent avec la carte
          // stats "Total à payer (Indépendants)". Fallback totalNet si l'ancien
          // backend ne renvoie pas encore la décomposition.
          livreurs: grille.stats.nbIndependants ?? grille.stats.totalLivreurs,
          tickets: grille.stats.totalTickets,
          net: grille.stats.totalAPayer ?? grille.stats.totalNet,
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

      {/* Confirmation de clôture manuelle du créneau. */}
      <ConfirmModal
        isOpen={cloturerOpen}
        onClose={() => setCloturerOpen(false)}
        title="Clôturer le créneau"
        isLoading={isCloturant}
        actions={[
          { label: 'Annuler', variant: 'bordered', onPress: () => setCloturerOpen(false) },
          {
            label: 'Clôturer',
            color: 'warning',
            onPress: () => {
              handleCloturerCreneau();
              setCloturerOpen(false);
            },
          },
        ]}
      >
        <p className="text-sm text-gray-700">
          Le créneau sera verrouillé. Tout ticket saisi <span className="font-semibold">après</span> la
          clôture ne sera plus comptabilisé directement : il passera par la{' '}
          <span className="font-semibold">Régularisation</span> (circuit tickets en retard).
        </p>
      </ConfirmModal>

      {/* V137 — Annulation de la clôture. Le motif est obligatoire (30 caractères
          minimum, contrôlé aussi côté serveur) : cette action défait une décision
          de fin de semaine sur de la paie, elle doit rester justifiable. */}
      <ConfirmModal
        isOpen={annulerClotureOpen}
        onClose={() => setAnnulerClotureOpen(false)}
        title="Annuler la clôture du créneau"
        isLoading={isAnnulantCloture}
        actions={[
          { label: 'Annuler', variant: 'bordered', onPress: () => setAnnulerClotureOpen(false) },
          {
            label: 'Rouvrir le créneau',
            color: 'warning',
            onPress: () => handleAnnulerCloture(motifReouverture),
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-700">
            Le créneau redevient modifiable et les tickets de la semaine y seront à nouveau
            comptabilisés. Pensez à le <span className="font-semibold">clôturer à nouveau</span>{' '}
            une fois la semaine complète.
          </p>
          <p className="text-sm text-gray-700">
            La réouverture est refusée si un lot de paie a déjà été soumis au DGA.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Motif de la réouverture</span>
            <textarea
              value={motifReouverture}
              onChange={(e) => setMotifReouverture(e.target.value)}
              rows={3}
              placeholder="Exemple : tickets du samedi non saisis, semaine rouverte pour les ajouter avant clôture."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-hidden focus:border-amber-500"
            />
            <span
              className={
                motifReouverture.trim().length >= 30 ? 'text-xs text-gray-400' : 'text-xs text-amber-700'
              }
            >
              {motifReouverture.trim().length} / 30 caractères minimum
            </span>
          </label>
        </div>
      </ConfirmModal>
    </div>
  );
}
