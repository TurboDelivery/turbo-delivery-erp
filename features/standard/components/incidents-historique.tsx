'use client';

import { Card, Table, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { Camera, ChevronDown, FileText, History } from 'lucide-react';
import React, { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { IIncident, StatutIncident, useIncidentsQuery } from '@/features/standard';

import { IncidentStatutChip } from './incident-statut-chip';
import { dateIncident } from '../utils/incident-ui.utils';

type FiltreHistorique = 'TRAITE' | 'CLOTURE' | 'TOUS';

const FILTRES: { cle: FiltreHistorique; libelle: string }[] = [
  { cle: 'TRAITE', libelle: 'Traités' },
  { cle: 'CLOTURE', libelle: 'Clôturés' },
  { cle: 'TOUS', libelle: 'Tous les incidents' },
];

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'etat', libelle: 'État' },
  { id: 'motif', libelle: 'Motif' },
  { id: 'livreur', libelle: 'Livreur' },
  { id: 'signale', libelle: 'Signalé le' },
  { id: 'preuve', libelle: 'Preuve' },
] as const;

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
    <Card>
      <button
        aria-expanded={ouvert}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-surface-secondary"
        onClick={() => setOuvert((o) => !o)}
        type="button"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-muted">
            <History aria-hidden="true" className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">Traités et clôturés</span>
            <span className="block text-xs text-muted">
              Historique des signalements réglés — replié pour laisser la place à
              l&apos;urgence.
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 text-muted transition-transform ${ouvert ? 'rotate-180' : ''}`}
        />
      </button>

      {ouvert && (
        <div className="flex flex-col gap-3 border-t border-separator px-4 py-4">
          {/*
           * Le filtre actif etait peint `bg-surface-secondary text-white` : du BLANC sur
           * une surface CLAIRE. Le libellé du filtre choisi était donc illisible — c'est
           * justement celui qu'on veut lire.
           */}
          <ToggleButtonGroup
            onSelectionChange={(sel) =>
              changerFiltre(String(Array.from(sel)[0] ?? 'TRAITE') as FiltreHistorique)
            }
            selectedKeys={new Set([filtre])}
            selectionMode="single"
            size="sm"
          >
            {FILTRES.map((f) => (
              <ToggleButton id={f.cle} key={f.cle}>
                {f.libelle}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {isError ? (
            <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les incidents" />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Historique des incidents"
                  className="min-w-[48rem]"
                  onRowAction={(cle: React.Key) => {
                    const inc = incidents.find((i) => i.id === String(cle));
                    if (inc) onOuvrir(inc);
                  }}
                >
                  <Table.Header>
                    {COLONNES.map((c) => (
                      <Table.Column id={c.id} isRowHeader={c.id === 'etat'} key={c.id}>
                        {c.libelle}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body
                    renderEmptyState={() =>
                      isLoading ? null : (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucun incident dans cette sélection
                        </p>
                      )
                    }
                  >
                    {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                            {COLONNES.map((c) => (
                              <Table.Cell key={`sq-${i}-${c.id}`}>
                                <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : null}

                    {(isLoading ? [] : incidents).map((inc) => (
                      <Table.Row className="cursor-pointer" id={inc.id} key={inc.id}>
                        <Table.Cell>
                          <IncidentStatutChip statut={inc.statut} />
                        </Table.Cell>
                        <Table.Cell className="font-medium">{inc.motifLibelle}</Table.Cell>
                        <Table.Cell>
                          {inc.livreurNom ?? <span className="text-muted">—</span>}
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap text-muted">
                          {dateIncident(inc.signaleLe)}
                        </Table.Cell>
                        <Table.Cell>
                          {inc.preuveUrl ? (
                            inc.preuveType === 'PHOTO' || inc.preuveType === null ? (
                              <Camera aria-hidden="true" className="size-4 text-muted" />
                            ) : (
                              <FileText aria-hidden="true" className="size-4 text-muted" />
                            )
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>

              {totalPages > 1 && (
                <Table.Footer className="justify-center">
                  <PaginationTableau
                    onPage={(p) => setPage(p - 1)}
                    page={page + 1}
                    total={totalPages}
                  />
                </Table.Footer>
              )}
            </Table>
          )}
        </div>
      )}
    </Card>
  );
}
