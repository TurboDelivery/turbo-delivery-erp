'use client';

import { Card, Chip, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import { Mail, Phone } from 'lucide-react';
import React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  LivreurMobileCard,
  LivreurMobileCardList,
} from '@/components/dashboard/delivery-men/shared/livreur-mobile-card';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { useTurboyTable } from '@/features/turboys/hooks/use-turboy-table';
import { TurboyType } from '@/features/turboys/types/turboys.types';
import {
  getTurboyTypeDisplay,
  TURBOY_FILTER_OPTIONS,
} from '@/features/turboys/utils/type-livreur-display';
import { formatMontant } from '@/utils/format.utils';

import {
  getTurboyStatusColor,
  getTurboyStatusLabel,
  TurboyActionsCell,
} from './turboy-table-columns';

/**
 * La liste des livreurs.
 *
 * <h3>Ce qui change</h3>
 * <p>Les LIGNES du tableau étaient peintes : violet pour un indépendant, bleu ciel pour un
 * journalier, avec leurs contreparties `dark:` écrites à la main. Un tableau de cent
 * livreurs devenait deux blocs de couleur, et la colonne « Type » disait déjà la même
 * chose, à côté. Rien ne restait pour signaler une ligne qui, elle, appelle une action.</p>
 *
 * <p>Le filtre par type n'en proposait que DEUX sur trois : `SUPERVISEUR_LIVREUR`, ajouté
 * en V54, n'y a jamais été. On ne pouvait pas isoler cette population — celle-là même que
 * la note de cadrage avait fait créer. Et une fois un type choisi, aucune entrée ne
 * permettait de revenir à la liste complète : il fallait recharger la page. Le filtre
 * reprend les quatre entrées du référentiel, « Tous les types » compris.</p>
 *
 * <p>Le compteur total était une pastille en ROUGE DE MARQUE, et le titre de la page
 * aussi. Le carré bleu vif derrière l'icône n'appartenait à aucune palette de l'ERP.</p>
 */
export function TurboyTable() {
  const { filters, isError, isFetching, isLoading, refetch, setFilters, table, turboysData } =
    useTurboyTable();

  const changerType = (valeur: string) =>
    void setFilters((prev) => ({
      ...prev,
      page: 0,
      typeLivreur: (valeur || undefined) as TurboyType | undefined,
    }));

  const filtreType = (
    <div className="w-full sm:w-64">
      <ChampListe
        label="Type de livreur"
        onChange={changerType}
        options={TURBOY_FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        placeholder="Tous les types"
        valeur={filters.typeLivreur ?? ''}
      />
    </div>
  );

  const pagination = turboysData?.livreurs?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turboys</h1>
          <p className="text-sm text-muted">Gestion des livreurs et prestataires</p>
        </div>
        {/* Un « Total: 0 » apres un echec de lecture se lit comme un comptage :
            on montre un tiret tant que la liste n a pas pu etre lue. */}
        <Chip size="lg" variant="soft">
          <Chip.Label>
            {isError ? '—' : (turboysData?.livreurs?.totalElements ?? 0)} livreurs
          </Chip.Label>
        </Chip>
      </div>

      {/* L echec remplace les DEUX rendus (tableau desktop et cartes mobiles) :
          les laisser vivre afficherait « Aucun turboy trouve », c est-a-dire un
          resultat vide, alors que la liste n a pas pu etre lue. */}
      {isError ? (
        <EtatErreur enCours={isFetching} onReessayer={() => void refetch()} quoi="les turboys" />
      ) : (
        <>
          <Card className="hidden md:block">
            <Card.Header>{filtreType}</Card.Header>
            <Card.Content className="p-0">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Livreurs">
                    <Table.Header>
                      {table.getFlatHeaders().map((header, i) => (
                        <Table.Column
                          className="text-xs font-medium whitespace-nowrap sm:text-sm"
                          id={header.id}
                          isRowHeader={i === 0}
                          key={header.id}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body
                      renderEmptyState={() =>
                        isLoading ? null : (
                          <p className="py-8 text-center text-sm text-muted">Aucun turboy trouvé.</p>
                        )
                      }
                    >
                      {isLoading
                        ? Array.from({ length: 10 }).map((_, i) => (
                            <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                              {Array.from({ length: table.getAllColumns().length }).map((_, j) => (
                                <Table.Cell className="h-12" key={`skeleton-cell-${j}`}>
                                  <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))
                        : table.getRowModel().rows.map((row) => (
                            <Table.Row id={row.id} key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <Table.Cell
                                  className="px-2 py-1 text-xs whitespace-nowrap"
                                  key={cell.id}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {pagination > 1 && (
                  <Table.Footer>
                    <PaginationTableau
                      onPage={(p) => setFilters((prev) => ({ ...prev, page: p - 1 }))}
                      page={filters.page ? filters.page + 1 : 1}
                      total={pagination}
                    />
                  </Table.Footer>
                )}
              </Table>
            </Card.Content>
          </Card>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className="md:hidden">
            <div className="mb-3">{filtreType}</div>
            <LivreurMobileCardList>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div className="h-44 animate-pulse rounded-xl bg-surface-secondary" key={i} />
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Aucun turboy trouvé.</p>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const t = row.original;
                  const display = getTurboyTypeDisplay(t.typeLivreur);
                  return (
                    <LivreurMobileCard
                      actions={<TurboyActionsCell turboy={t} />}
                      avatarUrl={t.avatarUrl}
                      fields={[
                        { label: 'Genre', value: t.gender || '-' },
                        { label: 'Type', value: display.label },
                        {
                          label: 'Salaire',
                          value: t.salaire ? `${formatMontant(t.salaire)}` : '-',
                        },
                        {
                          label: 'Commission',
                          value:
                            t.commission !== null && t.commission !== undefined
                              ? `${t.commission} %`
                              : '-',
                        },
                        { label: 'Immatriculation', value: t.immatriculation || '-' },
                        { label: 'Matricule', value: t.matricule || '-' },
                      ]}
                      key={row.id}
                      nom={`${t.prenoms} ${t.nom}`}
                      sousTitre={
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <Phone aria-hidden="true" className="size-3.5 text-muted" />{' '}
                            {t.telephone || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail aria-hidden="true" className="size-3.5 text-muted" />{' '}
                            {t.email || '-'}
                          </span>
                        </div>
                      }
                      statut={getTurboyStatusLabel(t.status)}
                      statutColor={getTurboyStatusColor(t.status)}
                    />
                  );
                })
              )}
            </LivreurMobileCardList>
            {pagination > 1 && (
              <div className="flex justify-center pt-3">
                <PaginationTableau
                  onPage={(p) => setFilters((prev) => ({ ...prev, page: p - 1 }))}
                  page={filters.page ? filters.page + 1 : 1}
                  total={pagination}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
