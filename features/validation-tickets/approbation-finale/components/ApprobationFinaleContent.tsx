'use client';

import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import useApprobationFinale from '../hooks/use-approbation-finale';
import { formatPeriode } from '../utils/approbation-finale.utils';
import ApprobationFinaleBanner from './ApprobationFinaleBanner';
import ApprobationFinaleWaveTable from './ApprobationFinaleWaveTable';
import ApprobationFinaleActionBar from './ApprobationFinaleActionBar';
import ApprobationFinaleTraceabilite from './ApprobationFinaleTraceabilite';
import ApprobationFinaleSignatures from './ApprobationFinaleSignatures';
import ApprobationFinaleApprouverModal from './ApprobationFinaleApprouverModal';
import ApprobationFinaleRejetModal from './ApprobationFinaleRejetModal';

export default function ApprobationFinaleContent() {
  const {
    creneauActif,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    grilleMeta,
    waveTable,
    approbation,
    isLoading,
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

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
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
            <h1 className="text-xl sm:text-2xl font-bold text-red-500">
              Approbation finale{creneauActif ? ` — Créneau ${creneauActif.label}` : ''}
            </h1>
            {creneauActif && (
              <p className="text-sm text-gray-400 mt-0.5">
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
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
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
      ) : !grilleMeta ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-24">
          <p className="text-sm text-gray-400">Aucun dossier en attente d&apos;approbation finale.</p>
        </div>
      ) : (
        <>
          <ApprobationFinaleBanner
            visePar={grilleMeta.visePar}
            viseAt={grilleMeta.viseAt}
            totalNet={grilleMeta.stats.totalNet}
            totalLivreurs={grilleMeta.stats.totalLivreurs}
          />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <ApprobationFinaleWaveTable
              waveTable={waveTable}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
            />
            {approbation?.chaineSignatures && approbation.chaineSignatures.length > 0 && (
              <ApprobationFinaleSignatures signataires={approbation.chaineSignatures} />
            )}
          </div>

          {soumisAuPdg && (
            <ApprobationFinaleActionBar
              isApprouvant={isApprouvant}
              isRejetant={isRejetant}
              onRejeter={openRejet}
              onApprouver={openApprouver}
            />
          )}

          {approbation?.traceabilite && (
            <ApprobationFinaleTraceabilite traceabilite={approbation.traceabilite} />
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
              livreurs: grilleMeta.stats.totalLivreurs,
              net: grilleMeta.stats.totalNet,
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
