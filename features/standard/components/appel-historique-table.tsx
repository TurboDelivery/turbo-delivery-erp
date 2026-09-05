'use client';

import { Button, Card, Chip, Table } from '@heroui-v3/react';
import { Ear, Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import {
  ContexteAppel,
  IAppelLog,
  StatutAppel,
  STATUT_APPEL_LABEL,
  useAppelsQuery,
} from '@/features/standard';

import { useAppel } from './appel-provider';

const CONTEXTE_LABEL: Record<ContexteAppel, string> = {
  LIVREUR_VERS_STANDARD: 'Livreur → Standard',
  STANDARD_VERS_LIVREUR: 'Standard → Livreur',
  PAIR_VERS_PAIR: 'Pair → Pair',
};

/**
 * Le ton d'un statut d'appel.
 *
 * <p>« Initié » et « Sonne » étaient en ambre : ce sont les états NORMAUX d'un appel qui
 * part, pas des avertissements. « En cours » était en `primary` — la couleur de marque —
 * là où c'est justement la ligne qu'un superviseur cherche : elle passe à l'accent, qui
 * appelle l'œil sans dire « problème ».</p>
 */
const STATUT_COLOR: Record<StatutAppel, 'accent' | 'danger' | 'default' | 'success'> = {
  ANNULE: 'default',
  EN_COURS: 'accent',
  INITIE: 'default',
  MANQUE: 'danger',
  REJETE: 'danger',
  SONNE: 'default',
  TERMINE: 'success',
};

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { alignDroite: false, id: 'date', libelle: 'Date' },
  { alignDroite: false, id: 'sens', libelle: 'Sens' },
  { alignDroite: false, id: 'destinataire', libelle: 'N° / destinataire' },
  { alignDroite: false, id: 'statut', libelle: 'Statut' },
  { alignDroite: false, id: 'duree', libelle: 'Durée' },
  { alignDroite: true, id: 'ecouter', libelle: 'Écouter' },
] as const;

function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuree(sec: number | null): string {
  if (sec == null || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AppelHistoriqueTable() {
  const [page, setPage] = useState(0);
  // Rafraîchit périodiquement pour faire remonter les appels EN COURS (écoute).
  // 30 s et non 8 : le socket pousse déjà les six évènements APPEL_*, ce poll n'est
  // qu'un filet, et il tournait à 450 requêtes par heure sur un simple journal.
  const { data, isLoading, isError, isFetching, refetch } = useAppelsQuery(page, 15, 30_000);
  const { superviser, estSuperviseur, enAppel } = useAppel();
  const appels: IAppelLog[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <Card>
      <Card.Content className="gap-3 p-4">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-foreground">
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-muted">
            <Phone aria-hidden="true" className="size-5" />
          </span>
          Historique des appels
        </h2>
        {isError ? (
          // Sans ce cas, une panne du journal affichait « Aucun appel enregistré »,
          // soit exactement ce que montre un standard sans activite.
          <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les appels" />
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Historique des appels" className="min-w-[52rem]">
                <Table.Header>
                  {COLONNES.map((c) => (
                    <Table.Column
                      className={c.alignDroite ? 'text-right' : undefined}
                      id={c.id}
                      isRowHeader={c.id === 'date'}
                      key={c.id}
                    >
                      {c.libelle}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <p className="py-8 text-center text-sm text-muted">Aucun appel enregistré</p>
                    )
                  }
                >
                  {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES.map((c) => (
                            <Table.Cell key={`sq-${i}-${c.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading ? [] : appels).map((a) => {
                    const entrant = a.contexte === 'LIVREUR_VERS_STANDARD';
                    return (
                      <Table.Row id={a.id} key={a.id}>
                        <Table.Cell className="whitespace-nowrap text-muted">
                          {formatInstant(a.declencheLe)}
                        </Table.Cell>
                        <Table.Cell>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            {entrant ? (
                              <PhoneIncoming aria-hidden="true" className="size-4 text-muted" />
                            ) : (
                              <PhoneOutgoing aria-hidden="true" className="size-4 text-muted" />
                            )}
                            {CONTEXTE_LABEL[a.contexte] ?? a.contexte}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          {a.appeleTelephone ?? <span className="text-muted">—</span>}
                        </Table.Cell>
                        <Table.Cell>
                          {a.statut ? (
                            <Chip color={STATUT_COLOR[a.statut] ?? 'default'} size="sm" variant="soft">
                              <Chip.Label>{STATUT_APPEL_LABEL[a.statut] ?? a.statut}</Chip.Label>
                            </Chip>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums">{formatDuree(a.dureeSec)}</Table.Cell>
                        <Table.Cell className="text-right">
                          {a.statut === 'EN_COURS' && estSuperviseur ? (
                            <Button
                              isDisabled={enAppel}
                              onPress={() =>
                                superviser(
                                  a.id,
                                  `${a.appelantNom ?? 'Appelant'} ↔ ${a.appeleNom ?? a.appeleTelephone ?? 'Appelé'}`,
                                )
                              }
                              size="sm"
                              variant="outline"
                            >
                              <Ear aria-hidden="true" className="size-4" />
                              Écouter
                            </Button>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={totalPages} />
              </Table.Footer>
            )}
          </Table>
        )}
      </Card.Content>
    </Card>
  );
}
