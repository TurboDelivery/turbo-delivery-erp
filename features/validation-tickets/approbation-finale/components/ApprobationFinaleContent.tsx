'use client';

import { Info, Lock } from 'lucide-react';
import { useAbility } from '@casl/react';
/*
 * `Skeleton` de HeroUI V3, et non plus la primitive maison de `components/ui`.
 *
 * <p>L'ancienne primitive teintait son fond avec la couleur de marque : sur cet ecran,
 * les quatre blocs d'attente etaient donc des rectangles rouges, de la meme famille que
 * le titre et les alertes. L'attente se lisait comme un incident. Le composant V3 se
 * peint sur la surface tertiaire du theme, neutre en clair comme en sombre, et porte son
 * propre balayage lumineux : l'attente redevient une attente.</p>
 */
import { Skeleton } from '@heroui-v3/react';
import { AbilityContext } from '@/lib/casl/ability-context';
import EtatErreur from '@/components/commons/EtatErreur';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import useApprobationFinale from '../hooks/use-approbation-finale';
import { formatPeriode } from '../utils/approbation-finale.utils';
import ApprobationFinaleBanner from './ApprobationFinaleBanner';
import ApprobationFinaleWaveTable from './ApprobationFinaleWaveTable';
import ApprobationFinaleActionBar from './ApprobationFinaleActionBar';
import ApprobationFinaleApprouverModal from './ApprobationFinaleApprouverModal';
import ApprobationFinaleRejetModal from './ApprobationFinaleRejetModal';

export default function ApprobationFinaleContent() {
  // Garde page : l'approbation finale (déclenche les virements Wave) est
  // réservée au DG/PDG. Défense en profondeur en plus du masquage du menu —
  // un DGA (manage Ticket + read all) ne doit pas pouvoir y accéder par l'URL.
  const ability = useAbility(AbilityContext);
  const canApprouver = ability.can('approuver-dg', 'PageApprobationFinale');

  const {
    creneauActif,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    grilleMeta,
    waveTable,
    isLoading,
    isError,
    isFetching,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    soumisAuPdg,
    approuverOpen,
    rejetOpen,
    motif,
    setMotif,
    isApprouvant,
    isRejetant,
    openApprouver,
    closeApprouver,
    openRejet,
    closeRejet,
    handleApprouver,
    handleRejeter,
  } = useApprobationFinale();

  if (!canApprouver) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
        <Lock aria-hidden="true" className="h-8 w-8 text-muted" />
        <h1 className="text-lg font-bold text-foreground">Accès réservé au DG</h1>
        <p className="max-w-md text-sm text-muted">
          L&apos;approbation finale (déclenchement des virements Wave) est réservée à la Présidence (DG/PDG).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">
        Pôle 4 — Présidence
      </p>

      {isLoading ? (
        <>
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-56" />
        </>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Approbation finale{creneauActif ? ` — Créneau ${creneauActif.label}` : ''}
            </h1>
            {creneauActif && (
              <p className="text-sm text-muted mt-0.5">
                {formatPeriode(creneauActif.dateDebut, creneauActif.dateFin)} · Visé par le DGA
              </p>
            )}
          </div>
          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={selectedCreneauId}
            onSelectCreneau={setSelectedCreneauId}
            disabled={isLoadingCreneaux}
          />
        </div>
      )}

      {!isLoading && creneauActif && !soumisAuPdg && (
        /*
         * L'avertissement etait peint en ambre fixe, sans variante sombre : en theme
         * sombre, la bande gardait son aplat clair et le texte fonce pose dessus devenait
         * illisible. Or c'est la seule phrase qui explique au DG pourquoi il n'a rien a
         * approuver ; illisible, elle lui laisse croire a un ecran vide. L'echelle d'etat
         * warning porte ses deux themes.
         */
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
          <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-warning-soft-foreground" />
          <p className="text-sm text-warning-soft-foreground">
            Ce dossier n&apos;est pas encore soumis pour approbation finale — en attente de validation à un niveau précédent.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex flex-col gap-5 lg:flex-row">
            <Skeleton className="h-80 flex-1 rounded-xl" />
            <Skeleton className="h-48 lg:h-80 lg:w-[300px] rounded-xl" />
          </div>
        </div>
      ) : isError ? (
        /* Un echec de chargement ne doit pas se lire comme « aucun dossier a approuver ». */
        <div className="rounded-xl border border-separator bg-surface">
          <EtatErreur
            quoi="le dossier à approuver"
            onReessayer={() => refetch()}
            enCours={isFetching}
          />
        </div>
      ) : !grilleMeta ? (
        <div className="flex items-center justify-center rounded-xl border border-separator bg-surface py-24">
          <p className="text-sm text-muted">Aucun dossier en attente d&apos;approbation finale.</p>
        </div>
      ) : (
        <>
          <ApprobationFinaleBanner
            visePar={grilleMeta.visePar}
            viseAt={grilleMeta.viseAt}
            totalNet={grilleMeta.stats.totalAPayer ?? grilleMeta.stats.totalNet}
            totalLivreurs={grilleMeta.stats.nbIndependants ?? grilleMeta.stats.totalLivreurs}
          />

          <ApprobationFinaleWaveTable
            waveTable={waveTable}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />

          {soumisAuPdg && (
            <ApprobationFinaleActionBar
              isApprouvant={isApprouvant}
              isRejetant={isRejetant}
              onRejeter={openRejet}
              onApprouver={openApprouver}
            />
          )}
        </>
      )}

      {grilleMeta && creneauActif && (
        <>
          <ApprobationFinaleApprouverModal
            open={approuverOpen}
            onClose={closeApprouver}
            onConfirm={handleApprouver}
            isLoading={isApprouvant}
            codeCreneau={creneauActif.label}
            totaux={{
              livreurs: grilleMeta.stats.nbIndependants ?? grilleMeta.stats.totalLivreurs,
              net: grilleMeta.stats.totalAPayer ?? grilleMeta.stats.totalNet,
            }}
          />
          <ApprobationFinaleRejetModal
            open={rejetOpen}
            onClose={closeRejet}
            onConfirm={handleRejeter}
            isLoading={isRejetant}
            motif={motif}
            onMotifChange={setMotif}
          />
        </>
      )}
    </div>
  );
}
