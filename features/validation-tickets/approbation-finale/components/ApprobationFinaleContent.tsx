'use client';

import { useEffect, useRef } from 'react';
import { flexRender } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { CheckCircle2, Globe, Info, Loader2, Lock, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useApprobationFinale from '../hooks/use-approbation-finale';
import ApprobationFinaleSignatures from './ApprobationFinaleSignatures';
import ApprobationFinaleApprouverModal from './ApprobationFinaleApprouverModal';
import ApprobationFinaleRejetModal from './ApprobationFinaleRejetModal';

function formatPeriode(debut: string, fin: string) {
  const d = new Date(debut);
  const f = new Date(fin);
  return `${format(d, 'd MMMM', { locale: fr })} → ${format(f, 'd MMMM yyyy', { locale: fr })}`;
}

function formatDateHeure(iso: string) {
  const d = new Date(iso);
  return `${format(d, 'd MMMM yyyy', { locale: fr })} — ${format(d, "HH'h'mm")}`;
}

function formatHorodatage(iso: string) {
  return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: fr });
}

export default function ApprobationFinaleContent() {
  const {
    creneauActif,
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

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Section label */}
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        Pôle 4 — Présidence
      </p>

      {/* Title — toujours visible dès que le créneau actif est chargé */}
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-56" />
        </>
      ) : (
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
      )}

      {/* Alert — dossier pas encore à ce niveau */}
      {!isLoading && creneauActif && !soumisAuPdg && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
            Ce dossier n&apos;est pas encore soumis pour approbation finale — en attente de validation à un niveau précédent.
          </p>
        </div>
      )}

      {/* Contenu principal */}
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
          {/* Banner visé DGA + montant total */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <ShieldCheck className="h-5 w-5 text-red-500" />
              </div>
              <div>
                {grilleMeta.visePar && grilleMeta.viseAt && (
                  <p className="text-sm font-semibold text-green-700">
                    Visé par {grilleMeta.visePar} le {formatDateHeure(grilleMeta.viseAt)}
                  </p>
                )}
                <p className="text-sm text-gray-800 mt-1">
                  Ce paiement a été vérifié et validé par{' '}
                  <span className="font-semibold text-green-700">5 niveaux de contrôle</span>.
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Saisie · V1 · V2 (Verrouillage) · Comptabilité · DGA.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Montant total à virer
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-0.5">
                {grilleMeta.stats.totalNet.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                FCFA · {grilleMeta.stats.totalLivreurs} Turboys via Wave
              </p>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            {/* Left: Wave recap table avec infinite scroll */}
            <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Récapitulatif des virements Wave
                </p>
              </div>
              <Table
                isStriped
                removeWrapper
                aria-label="Récapitulatif des virements Wave"
                bottomContent={
                  <div ref={bottomRef} className="flex items-center justify-center py-2">
                    {isFetchingNextPage && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                    )}
                  </div>
                }
              >
                <TableHeader>
                  {waveTable.getFlatHeaders().map((header) => (
                    <TableColumn key={header.id} className="text-[10px] uppercase tracking-widest">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody emptyContent="Aucun livreur trouvé">
                  {waveTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Right: Signature chain */}
            {approbation?.chaineSignatures && approbation.chaineSignatures.length > 0 && (
              <ApprobationFinaleSignatures signataires={approbation.chaineSignatures} />
            )}
          </div>

          {/* Actions — visibles uniquement si statut SOUMIS_PDG */}
          {soumisAuPdg && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
              <Lock className="h-4 w-4 text-green-500 shrink-0 hidden sm:block" />
              <p className="text-sm text-gray-500 flex-1">
                Confirmation à double validation requise — déclenche immédiatement les virements Wave.
              </p>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Button variant="outline" className="gap-2" onClick={openRejet} disabled={isRejetant}>
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={openApprouver}
                  disabled={isApprouvant}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approuver et déclencher Wave
                </Button>
              </div>
            </div>
          )}

          {/* Traceability bar */}
          {approbation?.traceabilite && (
            <div className="flex items-center gap-5 rounded-lg border border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold text-gray-600">Traçabilité</span>
              </div>
              <span>
                Action :{' '}
                <span className="font-medium text-gray-700">{approbation.traceabilite.action}</span>
              </span>
              <span>
                Agent :{' '}
                <span className="font-medium text-gray-700">{approbation.traceabilite.agent}</span>
              </span>
              <span>
                Rôle :{' '}
                <span className="font-medium text-gray-700">{approbation.traceabilite.role}</span>
              </span>
              <span>
                Horodatage :{' '}
                <span className="font-medium text-gray-700">
                  {formatHorodatage(approbation.traceabilite.horodatage)}
                </span>
              </span>
              <span>
                IP :{' '}
                <span className="font-medium text-gray-700">{approbation.traceabilite.ip}</span>
              </span>
            </div>
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
