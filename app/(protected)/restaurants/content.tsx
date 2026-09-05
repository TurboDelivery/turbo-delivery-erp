'use client';

import { Button, Card, InputGroup, Table, TextField } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Download, Plus, Search, SlidersHorizontal } from 'lucide-react';
import React, { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { RestaurantMobileCard, RestaurantMobileCardList } from '@/components/restaurants/restaurant-mobile-card';
import { ActionsMenu, StatusChip } from '@/components/restaurants/table/restaurant-table-columns';
import { StatCard } from '@/features/men/components/stat-card';
import { useRestaurantTable } from '@/features/restaurants/hooks/use-restaurant-table';
import { useRestaurantStatusCountsQuery } from '@/features/restaurants/queries/restaurant-list.query';

const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

const TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Mensuel', value: 'MENSUEL' },
  { label: 'Quotidien', value: 'QUOTIDIEN' },
  { label: 'Hebdomadaire', value: 'HEBDOMADAIRE' },
  { label: 'Quinzaine', value: 'QUINZAINE' },
];

/** Vues par état du compte (cartes cliquables — même code que le backend). */
type VueStatut = '' | 'valides' | 'partiels' | 'nouveaux' | 'inactifs';

export default function Content() {
  const { table, isLoading, isFetching, isError, refetch, pagination, filters, setSearch, setFilters, handleExport, isExporting } = useRestaurantTable();
  const { data: counts } = useRestaurantStatusCountsQuery();
  const enTetes = table.getFlatHeaders();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const vue = (filters.statut ?? '') as VueStatut;
  const setVue = (statut: VueStatut) => setFilters((prev) => ({ ...prev, statut, page: 0 }));

  return (
    <div className="w-full pb-10 flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partenaires ({counts?.total ?? '…'})</h1>
          <p className="text-sm text-muted mt-0.5">Gérez tous vos partenaires en un seul endroit</p>
        </div>
        <div className="flex items-center gap-3">
          <Button isPending={isExporting} onPress={handleExport} size="sm" variant="outline">
            <Download aria-hidden="true" className="size-4" />
            Exporter
          </Button>
          {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3 :
              le bouton ne naviguait plus. C'est un lien, il porte un `href`. */}
          <LienBouton href="/restaurants/create" taille="sm" variante="primary">
            <Plus aria-hidden="true" className="size-4" />
            Créer un profil
          </LienBouton>
        </div>
      </div>

      {/* ── Cartes par état du compte (cliquables — filtrent le tableau) ── */}
      <div className="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Tous les partenaires"
          value={counts?.total ?? 0}
          highlight
          isActive={vue === ''}
          onClick={() => setVue('')}
        />
        <StatCard
          label="Validés"
          value={counts?.valides ?? 0}
          isActive={vue === 'valides'}
          onClick={() => setVue('valides')}
        />
        <StatCard
          label="Partiellement validés"
          value={counts?.partiels ?? 0}
          isActive={vue === 'partiels'}
          onClick={() => setVue('partiels')}
        />
        <StatCard
          label="Nouveaux (30 j)"
          value={counts?.nouveaux ?? 0}
          isActive={vue === 'nouveaux'}
          onClick={() => setVue('nouveaux')}
        />
        <StatCard
          label="Inactifs"
          value={counts?.inactifs ?? 0}
          isActive={vue === 'inactifs'}
          onClick={() => setVue('inactifs')}
        />
      </div>

      {/* ── Search + filter ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <TextField
            aria-label="Rechercher un partenaire par nom"
            className="flex-1"
            onChange={setSearch}
            value={filters.search ?? ''}
          >
            <InputGroup>
              <InputGroup.Prefix>
                <Search aria-hidden="true" className="size-4" />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Rechercher par nom…" />
            </InputGroup>
          </TextField>
          <Button
            className="shrink-0"
            onPress={() => setShowAdvanced((v) => !v)}
            size="sm"
            variant="outline"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filtres
            {showAdvanced ? (
              <ChevronUp aria-hidden="true" className="size-3" />
            ) : (
              <ChevronDown aria-hidden="true" className="size-3" />
            )}
          </Button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-separator bg-surface-secondary p-4 sm:grid-cols-3 lg:grid-cols-5">
            <ChampTexte
              label="Localisation"
              onChange={(v) => setFilters((prev) => ({ ...prev, localisation: v, page: 0 }))}
              valeur={filters.localisation ?? ''}
            />
            <ChampTexte
              label="Email"
              onChange={(v) => setFilters((prev) => ({ ...prev, email: v, page: 0 }))}
              type="email"
              valeur={filters.email ?? ''}
            />
            <ChampTexte
              label="Téléphone"
              onChange={(v) => setFilters((prev) => ({ ...prev, page: 0, telephone: v }))}
              type="tel"
              valeur={filters.telephone ?? ''}
            />
            <ChampTexte
              label="Commune"
              onChange={(v) => setFilters((prev) => ({ ...prev, commune: v, page: 0 }))}
              valeur={filters.commune ?? ''}
            />
            <ChampListe
              label="Méthode de recouvrement"
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, methodRecouvrement: v, page: 0 }))
              }
              options={TYPE_OPTIONS}
              placeholder="Tous les types"
              valeur={filters.methodRecouvrement ?? ''}
            />
          </div>
        )}
      </div>

      {/* ── Table (desktop ≥ md) ── */}
      {/* L'echec de lecture s'affiche ICI, et les deux messages d'etat vide
          (tableau desktop + cartes mobiles) sont neutralises en dessous : sans
          cela, l'ecran afficherait l'erreur ET « aucune donnee », ce qui revient
          a se contredire. */}
      {isError && (
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les partenaires" />
      )}

      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Liste des partenaires" className="min-w-[64rem]">
                <Table.Header>
                  {enTetes.map((header) => (
                    <Table.Column
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader={header.id === 'nomEtablissement'}
                      key={header.id}
                    >
                      {({ sortDirection }) =>
                        header.column.getCanSort() ? (
                          <Table.SortableColumnHeader sortDirection={sortDirection}>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.SortableColumnHeader>
                        ) : (
                          <>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </>
                        )
                      }
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    isLoading || isError ? null : (
                      <p className="py-8 text-center text-sm text-muted">Aucun partenaire trouvé.</p>
                    )
                  }
                >
                  {/*
                   * Le squelette compte ses cellules sur les MEMES en-tetes que les lignes.
                   * Il remplace aussi le voile opaque plein ecran qui recouvrait le tableau
                   * a chaque rafraichissement : on ne voyait plus rien pendant la lecture.
                   */}
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {enTetes.map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading || isError ? [] : table.getRowModel().rows).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell className={isFetching ? 'opacity-70' : undefined} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {pagination && pagination.pageCount > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau
                  onPage={(p) => pagination.handlePageChange(p)}
                  page={pagination.page + 1}
                  total={pagination.pageCount}
                />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* ── Cartes (mobile < md) ── */}
      <RestaurantMobileCardList>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-card-${i}`} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          isError ? null : <p className="text-sm text-muted text-center py-10">Aucun partenaire trouvé.</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const r = row.original;
            const isGratuite = r.typeCommission === 'GRATUIT';
            return (
              <RestaurantMobileCard
                key={r.id}
                nom={r.nomEtablissement}
                verified={r.status != null && r.status >= 1 && !isGratuite}
                gratuite={isGratuite}
                statut={<StatusChip status={r.status} typeCommission={r.typeCommission} />}
                fields={[
                  { label: 'Email', value: r.email || '-' },
                  { label: 'Téléphone', value: r.telephone || '-' },
                  { label: 'Localisation', value: r.localisation || r.commune || '-' },
                  { label: 'Cycle de paiement', value: RECOUVREMENT_LABELS[r.methodRecouvrement] ?? r.methodRecouvrement ?? '-' },
                ]}
                actions={<ActionsMenu id={r.id} name={r.nomEtablissement} status={r.status} />}
              />
            );
          })
        )}
        {pagination && pagination.pageCount > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau
              onPage={(p) => pagination.handlePageChange(p)}
              page={pagination.page + 1}
              total={pagination.pageCount}
            />
          </div>
        )}
      </RestaurantMobileCardList>
    </div>
  );
}
