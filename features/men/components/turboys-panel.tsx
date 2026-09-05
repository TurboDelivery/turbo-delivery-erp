'use client';

import {
  Button,
  Card,
  Pagination,
  SearchField,
  Spinner,
  Table,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui-v3/react';
import {
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { CheckCheck, GitMerge, Grid2x2, List, ToggleLeft, ToggleRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { FusionLivreursDialog } from '@/components/turboys/fusion/fusion-livreurs-dialog';
import { useTurboyFilters } from '@/features/turboys/hooks/use-turboy-filters';
import { useBulkActiverLivreursMutation, useBulkDesactiverLivreursMutation } from '@/features/turboys/queries';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import { type TurboyType } from '@/features/turboys/types/turboys.types';
import { TURBOY_FILTER_OPTIONS } from '@/features/turboys/utils/type-livreur-display';
import { type Restaurant } from '@/types/models';

import { CourierCard } from './courier-card';
import { getMenColumns } from './men-columns';

// V54 (2026-05-29) — Source unique des options de filtre — 4 entrées :
// "Tous les types" + INDEPENDANT + JOURNALIER + SUPERVISEUR_LIVREUR.
const TYPE_OPTIONS = TURBOY_FILTER_OPTIONS;

const PAGE_SIZE = 10;

/** `''` n'est pas une clé de sélection valable : le « tous » a besoin d'un nom. */
const TOUS = 'TOUS';

interface TurboysPanelProps {
  restaurants?: Restaurant[];
}

/**
 * La liste des coursiers.
 *
 * <h3>Ce qui change</h3>
 * <p>Un bouton « Filtres » trônait entre la recherche et le type. Il n'avait AUCUN
 * gestionnaire : on cliquait, il ne se passait rien. Un contrôle qui ment est pire qu'un
 * contrôle absent, il est retiré.</p>
 *
 * <p>Le filtre de type et la bascule grille/liste étaient l'un une liste déroulante,
 * l'autre deux boutons colorés à la main pour imiter un segmenté. Ce sont deux
 * `ToggleButtonGroup` : l'état actif se voit sans l'ouvrir et sans le deviner.</p>
 *
 * <p>La barre d'actions groupées était peinte en `bg-primary-50 border-primary-200
 * text-primary-700` — trois teintes de l'ANCIENNE palette, muettes dans le thème actuel,
 * donc une barre sans fond ni bordure sur un écran clair.</p>
 */
export function TurboysPanel({ restaurants = [] }: TurboysPanelProps) {
  const { filters, setFilters, setSearch, setTypeLivreur, setViewMode } = useTurboyFilters();
  const viewMode = filters.viewMode;

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [fusionOpen, setFusionOpen] = useState(false);

  // Debounce: attend 350ms avant d'envoyer la requête
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search ?? ''), 350);
    return () => clearTimeout(id);
  }, [filters.search]);

  const queryParams = useMemo(
    () => ({
      limit: filters.limit ?? PAGE_SIZE,
      page: filters.page ?? 0,
      search: debouncedSearch.trim() || undefined,
      typeLivreur: filters.typeLivreur ?? undefined,
    }),
    [filters.page, filters.limit, filters.typeLivreur, debouncedSearch],
  );

  const { data: turboysData, isError, isFetching, isLoading, refetch } = useTurboysByTypeQuery(queryParams);
  const turboys = turboysData?.livreurs?.content ?? [];

  const totalPages = turboysData?.livreurs?.totalPages ?? 1;
  const currentPage = (filters.page ?? 0) + 1;

  const columns = useMemo(() => getMenColumns(restaurants), [restaurants]);

  const table = useReactTable({
    columns,
    data: turboys,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;

  const bulkDesactiver = useBulkDesactiverLivreursMutation(() => setRowSelection({}));
  const bulkActiver = useBulkActiverLivreursMutation(() => setRowSelection({}));

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Recherche et filtre de type */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          aria-label="Rechercher un coursier"
          className="min-w-56 flex-1"
          onChange={setSearch}
          value={filters.search ?? ''}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Rechercher par nom, prénom, téléphone" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <ToggleButtonGroup
          className="flex-wrap"
          onSelectionChange={(s) => {
            const v = Array.from(s)[0];
            setTypeLivreur(v && v !== TOUS ? (String(v) as TurboyType) : null);
          }}
          selectedKeys={new Set([filters.typeLivreur ?? TOUS])}
          selectionMode="single"
        >
          {TYPE_OPTIONS.map((opt) => (
            <ToggleButton id={opt.value || TOUS} key={opt.value || TOUS}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {/* Barre d'actions groupées : elle n'existe que si quelque chose est coché. */}
      {selectedCount > 0 && (
        <Card className="border-accent/30 bg-accent-soft/25">
          <Card.Content className="flex-row flex-wrap items-center gap-3">
            <CheckCheck aria-hidden="true" className="size-4 shrink-0 text-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">
              {selectedCount} livreur{selectedCount > 1 ? 's' : ''} sélectionné
              {selectedCount > 1 ? 's' : ''}
            </span>
            <Button
              isDisabled={bulkDesactiver.isPending}
              isPending={bulkActiver.isPending}
              onPress={() => bulkActiver.mutate(selectedIds)}
              size="sm"
              variant="primary"
            >
              {bulkActiver.isPending ? (
                <Spinner size="sm" />
              ) : (
                <ToggleRight aria-hidden="true" className="size-4" />
              )}
              Activer
            </Button>
            <Button
              isDisabled={bulkActiver.isPending}
              isPending={bulkDesactiver.isPending}
              onPress={() => bulkDesactiver.mutate(selectedIds)}
              size="sm"
              variant="danger-soft"
            >
              {bulkDesactiver.isPending ? (
                <Spinner size="sm" />
              ) : (
                <ToggleLeft aria-hidden="true" className="size-4" />
              )}
              Désactiver
            </Button>
            {selectedCount >= 2 && (
              <Button
                isDisabled={bulkActiver.isPending || bulkDesactiver.isPending}
                onPress={() => setFusionOpen(true)}
                size="sm"
                variant="outline"
              >
                <GitMerge aria-hidden="true" className="size-4" />
                Fusionner
              </Button>
            )}
            <Button onPress={() => setRowSelection({})} size="sm" variant="ghost">
              Annuler
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Sans ce garde, un echec affichait « Aucun coursier a afficher. » :
          l'exploitation lisait une flotte vide au lieu d'une lecture ratee. */}
      {isError ? (
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les coursiers" />
      ) : viewMode === 'list' ? (
        <Card>
          <Card.Content className="p-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Tableau des coursiers" className="min-w-[64rem]">
                  <Table.Header>
                    {table.getFlatHeaders().map((header) => (
                      <Table.Column
                        id={header.id}
                        isRowHeader={header.id === 'prenoms'}
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? ''
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </Table.Column>
                    ))}
                  </Table.Header>

                  <Table.Body
                    renderEmptyState={() =>
                      isLoading || isFetching ? null : (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucun coursier à afficher.
                        </p>
                      )
                    }
                  >
                    {/* Le squelette prend la forme du tableau : la hauteur ne saute pas
                        quand la page arrive, et le compte des cellules se derive des
                        colonnes — React Aria fait tomber la page si les deux different. */}
                    {isLoading || isFetching
                      ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                          <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                            {table.getFlatHeaders().map((h) => (
                              <Table.Cell key={`sq-${i}-${h.id}`}>
                                <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : null}

                    {(isLoading || isFetching ? [] : table.getRowModel().rows).map((row) => (
                      <Table.Row id={row.id} key={row.id}>
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
            </Table>
          </Card.Content>
        </Card>
      ) : isLoading || isFetching ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="h-56 animate-pulse rounded-xl bg-surface-secondary" key={`sqc-${i}`} />
          ))}
        </div>
      ) : turboys.length === 0 ? (
        <Card>
          <Card.Content className="items-center py-12 text-center">
            <p className="text-sm text-muted">Aucun coursier à afficher.</p>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turboys.map((t) => (
            <CourierCard key={t.id} turboy={t} />
          ))}
        </div>
      )}

      {/* Bascule d'affichage à gauche, pagination à droite */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleButtonGroup
          onSelectionChange={(s) => {
            const v = Array.from(s)[0];
            if (v) setViewMode(String(v) as 'grid' | 'list');
          }}
          selectedKeys={new Set([viewMode])}
          selectionMode="single"
        >
          <ToggleButton id="grid">
            <Grid2x2 aria-hidden="true" className="size-4" />
            En grille
          </ToggleButton>
          <ToggleButton id="list">
            <List aria-hidden="true" className="size-4" />
            En liste
          </ToggleButton>
        </ToggleButtonGroup>

        {totalPages > 1 && (
          <Pagination size="sm">
            <Pagination.Summary>
              Page {currentPage} sur {totalPages}
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={currentPage === 1}
                  onPress={() => setFilters((prev) => ({ ...prev, page: Math.max(0, currentPage - 2) }))}
                >
                  <Pagination.PreviousIcon />
                  Précédent
                </Pagination.Previous>
              </Pagination.Item>
              {pages.map((p) => (
                <Pagination.Item key={p}>
                  <Pagination.Link
                    isActive={p === currentPage}
                    onPress={() => setFilters((prev) => ({ ...prev, page: p - 1 }))}
                  >
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={currentPage === totalPages}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, page: Math.min(totalPages - 1, currentPage) }))
                  }
                >
                  Suivant
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        )}
      </div>

      <FusionLivreursDialog
        ids={selectedIds}
        isOpen={fusionOpen}
        onDone={() => setRowSelection({})}
        onOpenChange={setFusionOpen}
      />
    </div>
  );
}
