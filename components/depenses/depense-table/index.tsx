'use client';

import { Card, Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { DepenseMobileCard } from '@/components/depenses/depense-table/depense-mobile-card';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { CreerDepenseModal } from '@/features/depenses/components/depense-list/creer-depense';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import {
  type DepenseFilters,
  type MagasinFiltresDepense,
  useDepenseTable,
} from '@/features/depenses/hooks/use-depense-table';
import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * Les dépenses de la période.
 *
 * <h3>Ce qui change</h3>
 * <p>Le total était affiché sur un dégradé `from-green-50 to-emerald-50`, bordé de
 * `border-green-200`, avec sa pastille `bg-green-100` et trois nuances de texte vert.
 * Sept classes de la palette Tailwind brute, sans une seule variante sombre — et du VERT
 * pour annoncer ce qu'on a DÉPENSÉ. Le vert de cet ERP dit « c'est bon » ; une somme
 * sortie de la caisse n'est ni bonne ni mauvaise, c'est un fait qu'on lit.</p>
 *
 * <p>Le nombre de dépenses était relégué en petit à droite du montant, dans le même vert.
 * C'est la seconde mesure du bandeau : elle prend sa place à côté de la première.</p>
 *
 * <p>Tous les en-têtes de colonnes étaient peints en `text-primary`, le ROUGE DE MARQUE :
 * sept titres de colonnes en rouge, au-dessus de lignes où rien n'appelle d'action.</p>
 *
 * <p>Enfin, le tableau n'avait PAS d'état vide : une période sans dépense n'affichait rien
 * du tout sous les en-têtes, ni message ni explication. Les cartes mobiles, elles,
 * disaient « Aucune dépense ».</p>
 *
 * <h3>UNE SEULE BARRE DE FILTRES</h3>
 * <p>Ce tableau reposait sa PROPRE période et sa propre liste de catégories dans son
 * en-tête, pilotées par le `useState` de `useDepenseTable`, alors que la page en portait
 * déjà une paire identique au-dessus, celle-là dans l'URL. Deux magasins indépendants,
 * avec des valeurs par défaut différentes (fin de mois en haut, aujourd'hui ici) : les
 * cartes et la liste pouvaient annoncer deux périodes sans que rien ne le dise, et
 * filtrer dans le tableau ne faisait pas bouger les cartes. Le tableau consomme
 * désormais le magasin de l'URL, et ses deux cartes, qui doublaient celles de la page,
 * ont cédé la place au total en PIED DE TABLEAU, à côté des lignes qu'il décrit.</p>
 */
export function DepenseTable() {
  /**
   * Le magasin de l'URL, passé au hook avec son écriture.
   *
   * <p>`useQueryStates` de nuqs sert le même état à tous ses appelants pour une URL
   * donnée : la barre de filtres de la page, la répartition et ce tableau lisent donc
   * la même vérité sans qu'on ait à la faire descendre en props.</p>
   */
  const { filters: filtresUrl, setFilters } = useDepenseDashboardFilters();
  const magasin: MagasinFiltresDepense = {
    filters: {
      categoriesDepense: filtresUrl.categoriesDepense,
      debut: filtresUrl.debut,
      fin: filtresUrl.fin,
      limit: filtresUrl.limit,
      orderBy: filtresUrl.orderBy || undefined,
      orderDirection: filtresUrl.orderDirection === 'asc' ? 'asc' : 'desc',
      page: filtresUrl.page,
      statut: filtresUrl.statut || undefined,
    },
    appliquer: (maj: (prev: DepenseFilters) => DepenseFilters) => {
      setFilters((prev) => maj(prev as unknown as DepenseFilters) as never);
    },
  };

  const { filters, isError, isFetching, isLoading, pagination, refetch, table } =
    useDepenseTable(magasin);

  // Les MEMES filtres que la liste, statut compris : c'est ce qui garantit que le total
  // du pied decrit bien les lignes au-dessus de lui.
  const { data: statsData } = useDepenseStatsQuery({
    categoriesDepense: filters.categoriesDepense || undefined,
    debut: filters.debut,
    fin: filters.fin,
    statut: filters.statut || undefined,
  });

  const pageCount = pagination?.pageCount ?? 1;

  /**
   * Le compte vient de la REQUÊTE DE LISTE, le montant des statistiques.
   *
   * <p>`totalElements` décrit exactement l'ensemble qui a produit les lignes affichées.
   * Le montant, lui, n'existe que dans `/stats`. Les deux concordent aujourd'hui parce
   * que les deux requêtes reçoivent les mêmes filtres.</p>
   *
   * <p>⚠ Elles divergeront le jour où un filtre de TYPE sera posé sur l'écran :
   * `/finance/depenses/pagination` accepte `typeDepense`, `/finance/depenses/stats` ne le
   * connaît pas. Le compte resterait juste et le montant compterait les deux types. Le
   * filtre de type ne doit donc pas être branché avant que `/stats` l'accepte.</p>
   */
  const totalLignes = pagination?.totalItems ?? 0;
  const montantTotal = statsData?.montant_total ?? 0;

  /**
   * Rien tant qu'on ne sait pas : un « 0 ligne au total · 0 FCFA » posé à côté d'un
   * message d'échec se lit comme une période vide, alors que c'est une panne.
   */
  const piedDeTableau =
    isError || isLoading ? null : (
      <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {totalLignes} {totalLignes > 1 ? 'lignes' : 'ligne'} au total
          {pageCount > 1 ? ` · page ${filters.page + 1} sur ${pageCount}` : ''}
        </p>
        <p className="text-sm font-medium">Total · {formatCFA(montantTotal)}</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CreerDepenseModal />
        </Card.Header>

        <Card.Content className="p-0">
          {/* L'echec de lecture s'affiche ICI, et le message d'etat vide des
              cartes mobiles est neutralise en dessous : sans cela l'ecran
              afficherait l'erreur ET « Aucune depense ». */}
          {isError && (
            <div className="p-4">
              <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les dépenses" />
            </div>
          )}

          {/* Tableau — desktop uniquement (≥ md) */}
          <div className="hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Dépenses">
                  <Table.Header>
                    {table.getFlatHeaders().map((header, i) => (
                      <Table.Column
                        allowsSorting={header.column.getCanSort()}
                        id={header.id}
                        isRowHeader={i === 0}
                        key={header.id}
                      >
                        {({ sortDirection }) =>
                          header.column.getCanSort() ? (
                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </Table.SortableColumnHeader>
                          ) : (
                            <>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </>
                          )
                        }
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body
                    renderEmptyState={() =>
                      isLoading || isError ? null : (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucune dépense sur la période
                        </p>
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                            {depenseColumns.map((col, j) => (
                              <Table.Cell className="h-12" key={`skeleton-cell-${j}`}>
                                <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <Table.Row
                            className={isFetching ? 'opacity-70' : undefined}
                            id={row.id}
                            key={row.id}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <Table.Cell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>
                {piedDeTableau}
                {pageCount > 1 && (
                  <PaginationTableau
                    onPage={pagination.handlePageChange}
                    page={filters.page + 1}
                    total={pageCount}
                  />
                )}
              </Table.Footer>
            </Table>
          </div>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className={`flex flex-col gap-3 p-4 md:hidden ${isFetching ? 'opacity-70' : ''}`}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" key={`m-skel-${i}`} />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              isError ? null : (
                <p className="py-10 text-center text-sm text-muted">Aucune dépense sur la période</p>
              )
            ) : (
              table.getRowModel().rows.map((row) => (
                <DepenseMobileCard depense={row.original} key={row.id} />
              ))
            )}
            {piedDeTableau}
            {pageCount > 1 && (
              <div className="flex justify-center pt-2">
                <PaginationTableau
                  onPage={pagination.handlePageChange}
                  page={filters.page + 1}
                  total={pageCount}
                />
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
