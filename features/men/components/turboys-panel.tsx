'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
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
} from '@heroui/react';
import { Grid2x2, List, Search, SlidersHorizontal } from 'lucide-react';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import { useTurboyFilters } from '@/features/turboys/hooks/use-turboy-filters';
import { type ITurboy, type TurboyType } from '@/features/turboys/types/turboys.types';
import { menColumns } from './men-columns';
import { CourierCard } from './courier-card';

const TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Indépendant', value: 'INDEPENDANT' },
  { label: 'Journalier', value: 'JOURNALIER' },
];

const PAGE_SIZE = 10;
const ALL_DATA_LIMIT = 1000;

export function TurboysPanel() {
  const { filters, setFilters, setSearch, setTypeLivreur, setViewMode } = useTurboyFilters();
  const viewMode = filters.viewMode;

  // Debounce: attend 350ms avant de déclencher le filtrage
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search ?? ''), 350);
    return () => clearTimeout(id);
  }, [filters.search]);

  const isSearching = debouncedSearch.trim().length > 0;

  // Quand recherche active → charge tout + filtre côté client
  // Quand recherche vide → pagination serveur normale
  const queryParams = useMemo(() => ({
    page: isSearching ? 0 : (filters.page ?? 0),
    limit: isSearching ? ALL_DATA_LIMIT : (filters.limit ?? PAGE_SIZE),
    typeLivreur: filters.typeLivreur ?? undefined,
  }), [isSearching, filters.page, filters.limit, filters.typeLivreur]);

  const { data: turboysData, isLoading, isFetching } = useTurboysByTypeQuery(queryParams);
  const allTurboys = turboysData?.content ?? [];

  // Filtrage client-side sur nom, prénom, téléphone, email, matricule
  const filteredTurboys = useMemo<ITurboy[]>(() => {
    if (!isSearching) return allTurboys;
    const term = debouncedSearch.toLowerCase();
    return allTurboys.filter((t) => {
      return (
        t.nom?.toLowerCase().includes(term) ||
        t.prenoms?.toLowerCase().includes(term) ||
        t.telephone?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.matricule?.toLowerCase().includes(term) ||
        t.habitation?.toLowerCase().includes(term)
      );
    });
  }, [allTurboys, isSearching, debouncedSearch]);

  // Pagination côté client quand on filtre
  const clientPage = isSearching ? (filters.page ?? 0) : 0;
  const turboys = isSearching
    ? filteredTurboys.slice(clientPage * PAGE_SIZE, (clientPage + 1) * PAGE_SIZE)
    : allTurboys;

  const totalPages = isSearching
    ? Math.max(1, Math.ceil(filteredTurboys.length / PAGE_SIZE))
    : (turboysData?.totalPages ?? 1);

  const currentPage = (filters.page ?? 0) + 1;

  const table = useReactTable({
    columns: menColumns,
    data: turboys,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

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
          startContent={<Search className="text-gray-400 w-4 h-4 shrink-0" />}
          placeholder="Rechercher par nom, prénom, téléphone, email..."
          value={filters.search ?? ''}
          onChange={(e) => setSearch(e.target.value)}
          isClearable
          onClear={() => setSearch('')}
          variant="bordered"
          size="sm"
        />
        <Button isIconOnly variant="bordered" size="sm" aria-label="Filtres" className="shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-xl">
            <Spinner color="primary" />
          </div>
        )}

        {viewMode === 'list' ? (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <Table
              aria-label="Tableau des coursiers"
              removeWrapper
              classNames={{ th: 'bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide', td: 'py-3' }}
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
                  <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
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
              <p className="col-span-3 text-center text-sm text-gray-400 py-12">
                Aucun coursier à afficher.
              </p>
            )}
            {turboys.map((t) => <CourierCard key={t.id} turboy={t} />)}
          </div>
        )}
      </div>

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
    </>
  );
}
