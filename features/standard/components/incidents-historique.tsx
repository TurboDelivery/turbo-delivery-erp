'use client';

import { useState } from 'react';
import {
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Camera, ChevronDown, FileText, History } from 'lucide-react';

import { IIncident, StatutIncident, useIncidentsQuery } from '@/features/standard';

import { IncidentStatutChip } from './incident-statut-chip';
import { dateIncident } from '../utils/incident-ui.utils';
import EtatErreur from '@/components/commons/EtatErreur';

type FiltreHistorique = 'TRAITE' | 'CLOTURE' | 'TOUS';

const FILTRES: { cle: FiltreHistorique; libelle: string }[] = [
  { cle: 'TRAITE', libelle: 'Traités' },
  { cle: 'CLOTURE', libelle: 'Clôturés' },
  { cle: 'TOUS', libelle: 'Tous les incidents' },
];

const TAILLE_PAGE = 10;

/**
 * Historique repliable : ce qui est traité ou clos ne doit pas occuper l'écran
 * d'un poste d'urgence. Replié par défaut, il n'appelle même pas le serveur tant
 * qu'on ne l'ouvre pas.
 */
export function IncidentsHistorique({ onOuvrir }: { onOuvrir: (incident: IIncident) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [filtre, setFiltre] = useState<FiltreHistorique>('TRAITE');
  const [page, setPage] = useState(0);

  const statut: StatutIncident | undefined = filtre === 'TOUS' ? undefined : filtre;
  const { data, isLoading, isFetching, isError, refetch } = useIncidentsQuery(statut, page, TAILLE_PAGE, { enabled: ouvert });

  const incidents = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const changerFiltre = (cle: FiltreHistorique) => {
    setFiltre(cle);
    setPage(0);
  };

  return (
    <section className="rounded-2xl border border-default-200/50 bg-white dark:bg-content1">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-default-50 dark:hover:bg-default-100/40"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-default-200/60 text-default-500">
            <History className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-default-700">Traités et clôturés</span>
            <span className="block text-xs text-default-400">
              Historique des signalements réglés — replié pour laisser la place à l&apos;urgence.
            </span>
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-default-400 transition-transform ${ouvert ? 'rotate-180' : ''}`}
        />
      </button>

      {ouvert && (
        <div className="space-y-3 border-t border-default-200/60 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {FILTRES.map((f) => {
              const actif = f.cle === filtre;
              return (
                <button
                  key={f.cle}
                  type="button"
                  onClick={() => changerFiltre(f.cle)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    actif
                      ? 'bg-[#17181C] text-white'
                      : 'bg-default-100 text-default-600 hover:bg-default-200'
                  }`}
                >
                  {f.libelle}
                </button>
              );
            })}
          </div>

          {isError ? (
            <EtatErreur quoi="les incidents" onReessayer={() => refetch()} enCours={isFetching} />
          ) : (
          <Table
            aria-label="Historique des incidents"
            removeWrapper
            onRowAction={(cle) => {
              const inc = incidents.find((i) => i.id === String(cle));
              if (inc) onOuvrir(inc);
            }}
            bottomContent={
              totalPages > 1 ? (
                <div className="flex justify-center pt-2">
                  <Pagination
                    total={totalPages}
                    page={page + 1}
                    onChange={(p) => setPage(p - 1)}
                    color="primary"
                    size="sm"
                    showControls
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn className="text-default-500">ÉTAT</TableColumn>
              <TableColumn className="text-default-500">MOTIF</TableColumn>
              <TableColumn className="text-default-500">LIVREUR</TableColumn>
              <TableColumn className="text-default-500">SIGNALÉ LE</TableColumn>
              <TableColumn className="text-default-500">PREUVE</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={isLoading ? ' ' : 'Aucun incident dans cette sélection'}
              isLoading={isLoading}
              loadingContent={<Spinner color="primary" label="Chargement…" />}
            >
              {incidents.map((inc) => (
                <TableRow key={inc.id} className="cursor-pointer">
                  <TableCell>
                    <IncidentStatutChip statut={inc.statut} />
                  </TableCell>
                  <TableCell className="font-medium">{inc.motifLibelle}</TableCell>
                  <TableCell>{inc.livreurNom ?? <span className="text-default-400">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-default-500">
                    {dateIncident(inc.signaleLe)}
                  </TableCell>
                  <TableCell>
                    {inc.preuveUrl ? (
                      inc.preuveType === 'PHOTO' || inc.preuveType === null ? (
                        <Camera className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )
                    ) : (
                      <span className="text-default-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </div>
      )}
    </section>
  );
}
