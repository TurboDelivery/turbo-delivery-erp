'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import { CheckCheck, GitMerge, Grid2x2, List, Search, SlidersHorizontal, ToggleLeft, ToggleRight } from 'lucide-react';
import { FusionLivreursDialog } from '@/components/turboys/fusion/fusion-livreurs-dialog';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import { useTurboyFilters } from '@/features/turboys/hooks/use-turboy-filters';
import { type TurboyType } from '@/features/turboys/types/turboys.types';
import { TURBOY_FILTER_OPTIONS } from '@/features/turboys/utils/type-livreur-display';
import { type Restaurant } from '@/types/models';
import { getMenColumns } from './men-columns';
import { CourierCard } from './courier-card';
import { useBulkDesactiverLivreursMutation, useBulkActiverLivreursMutation } from '@/features/turboys/queries';
import EtatErreur from '@/components/commons/EtatErreur';

// V54 (2026-05-29) — Source unique des options de filtre — 4 entrées :
// "Tous les types" + INDEPENDANT + JOURNALIER + SUPERVISEUR_LIVREUR.
const TYPE_OPTIONS = TURBOY_FILTER_OPTIONS;

const PAGE_SIZE = 10;

interface TurboysPanelProps {
  restaurants?: Restaurant[];
}

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

  const queryParams = useMemo(() => ({
    page: filters.page ?? 0,
    limit: filters.limit ?? PAGE_SIZE,
    typeLivreur: filters.typeLivreur ?? undefined,
    search: debouncedSearch.trim() || undefined,
  }), [filters.page, filters.limit, filters.typeLivreur, debouncedSearch]);

  const { data: turboysData, isLoading, isFetching, isError, refetch } = useTurboysByTypeQuery(queryParams);
  const turboys = turboysData?.livreurs?.content ?? [];

  const totalPages = turboysData?.livreurs?.totalPages ?? 1;
  const currentPage = (filters.page ?? 0) + 1;

  const columns = useMemo(() => getMenColumns(restaurants), [restaurants]);

  const table = useReactTable({
    columns,
    data: turboys,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;

  const bulkDesactiver = useBulkDesactiverLivreursMutation(() => setRowSelection({}));
  const bulkActiver = useBulkActiverLivreursMutation(() => setRowSelection({}));

  function handleBulkActivate() {
    bulkActiver.mutate(selectedIds);
  }
  function handleBulkDeactivate() {
    bulkDesactiver.mutate(selectedIds);
  }

  function handleTypeChange(keys: any) {
    const value = Array.from(keys as Set<string>)[0] ?? '';
    setTypeLivreur(value ? (value as TurboyType) : null);
  }
  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page: page - 1 }));
  }

  const pagination = totalPages > 1 ? (
    <Pagination
      total={totalPages}
      page={currentPage}
      onChange={handlePageChange}
      showControls
      color="primary"
      variant="bordered"
    />
  ) : null;

  return (
    <>
      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <Input
          className="flex-1"
          startContent={<Search className="text-muted w-4 h-4 shrink-0" />}
          placeholder="Rechercher par nom, prénom, téléphone"
          value={filters.search ?? ''}
          onChange={(e) => setSearch(e.target.value)}
          isClearable
          onClear={() => setSearch('')}
          variant="bordered"
          size="sm"
        />
        <Button isIconOnly variant="bordered" size="sm" aria-label="Filtres" className="shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-muted" />
        </Button>
        <Select
          aria-label="Filtrer par type"
          className="w-44 shrink-0"
          selectedKeys={filters.typeLivreur ? [filters.typeLivreur] : ['']}
          onSelectionChange={handleTypeChange}
          size="sm"
          variant="bordered"
        >
          {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value}>{opt.label}</SelectItem>)}
        </Select>
      </div>

      {/* Content area */}
      <div className="relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60 rounded-xl">
            <Spinner color="primary" />
          </div>
        )}

        {/* Sans ce garde, un echec affichait « Aucun coursier a afficher. » :
            l'exploitation lisait une flotte vide au lieu d'une lecture ratee. */}
        {isError ? (
          <EtatErreur quoi="les coursiers" onReessayer={() => refetch()} enCours={isFetching} />
        ) : viewMode === 'list' ? (
          <div className="rounded-xl border border-separator bg-surface shadow-xs overflow-hidden">
            <Table
              aria-label="Tableau des coursiers"
              removeWrapper
              classNames={{ th: 'bg-surface-secondary text-xs font-semibold text-muted uppercase tracking-wide', td: 'py-3' }}
            >
              <TableHeader>
                {table.getFlatHeaders().map((header) => (
                  <TableColumn key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent={isLoading ? ' ' : 'Aucun coursier à afficher.'}>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-surface-secondary transition-colors">
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {turboys.length === 0 && !isLoading && (
              <p className="col-span-3 text-center text-sm text-muted py-12">
                Aucun coursier à afficher.
              </p>
            )}
            {turboys.map((t) => <CourierCard key={t.id} turboy={t} />)}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200">
          <CheckCheck className="w-4 h-4 text-primary-500 shrink-0" />
          <span className="text-sm font-medium text-primary-700 flex-1">
            {selectedCount} livreur{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            color="success"
            variant="flat"
            startContent={<ToggleRight className="w-4 h-4" />}
            onPress={handleBulkActivate}
            isLoading={bulkActiver.isPending}
            isDisabled={bulkDesactiver.isPending}
          >
            Activer
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<ToggleLeft className="w-4 h-4" />}
            onPress={handleBulkDeactivate}
            isLoading={bulkDesactiver.isPending}
            isDisabled={bulkActiver.isPending}
          >
            Désactiver
          </Button>
          {selectedCount >= 2 && (
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              startContent={<GitMerge className="w-4 h-4" />}
              onPress={() => setFusionOpen(true)}
              isDisabled={bulkActiver.isPending || bulkDesactiver.isPending}
            >
              Fusionner
            </Button>
          )}
          <Button
            size="sm"
            variant="light"
            onPress={() => setRowSelection({})}
          >
            Annuler
          </Button>
        </div>
      )}

      {/* Bottom row: view toggle left, pagination right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'solid' : 'flat'}
            color={viewMode === 'grid' ? 'primary' : 'default'}
            size="sm"
            startContent={<Grid2x2 className="w-4 h-4" />}
            onPress={() => setViewMode('grid')}
          >
            En grille
          </Button>
          <Button
            variant={viewMode === 'list' ? 'solid' : 'flat'}
            color={viewMode === 'list' ? 'primary' : 'default'}
            size="sm"
            startContent={<List className="w-4 h-4" />}
            onPress={() => setViewMode('list')}
          >
            En liste
          </Button>
        </div>
        {pagination}
      </div>

      <FusionLivreursDialog
        ids={selectedIds}
        isOpen={fusionOpen}
        onOpenChange={setFusionOpen}
        onDone={() => setRowSelection({})}
      />
    </>
  );
}
