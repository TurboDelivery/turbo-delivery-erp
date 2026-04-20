'use client';

import React, { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Button,
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
import { Grid2x2, List } from 'lucide-react';
import { SearchField } from '@/components/commons/form/search-field';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import { useTurboyFilters } from '@/features/turboys/hooks/use-turboy-filters';
import { type TurboyType } from '@/features/turboys/types/turboys.types';
import { menColumns } from './men-columns';
import { CourierCard } from './courier-card';

const TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Indépendant', value: 'INDEPENDANT' },
  { label: 'Journalier', value: 'JOURNALIER' },
];

export function TurboysPanel() {
  const { filters, setFilters } = useTurboyFilters();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const queryParams = useMemo(() => ({
    page: filters.page ?? 0,
    limit: filters.limit ?? 10,
    search: search || undefined,
    typeLivreur: (filters.typeLivreur as TurboyType) || undefined,
  }), [filters.page, filters.limit, filters.typeLivreur, search]);

  const { data: turboysData, isLoading, isFetching } = useTurboysByTypeQuery(queryParams);
  const turboys = turboysData?.content ?? [];
  const totalPages = turboysData?.totalPages ?? 1;
  const currentPage = (filters.page ?? 0) + 1;

  const table = useReactTable({
    columns: menColumns,
    data: turboys,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters((prev) => ({ ...prev, page: 0 }));
  }
  function handleTypeChange(keys: any) {
    const value = Array.from(keys as Set<string>)[0] ?? '';
    setFilters((prev) => ({ ...prev, typeLivreur: value as TurboyType, page: 0 }));
  }
  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page: page - 1 }));
  }

  const paginationBlock = totalPages > 1 ? (
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
        <div className="flex-1">
          <SearchField searchKey={search} onChange={handleSearchChange} />
        </div>
        <Select
          aria-label="Filtrer par type"
          className="w-44"
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
              bottomContent={
                paginationBlock
                  ? <div className="flex justify-center py-3 border-t border-gray-100">{paginationBlock}</div>
                  : null
              }
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {turboys.length === 0 && !isLoading && (
                <p className="col-span-3 text-center text-sm text-gray-400 py-12">
                  Aucun coursier à afficher.
                </p>
              )}
              {turboys.map((t) => <CourierCard key={t.id} turboy={t} />)}
            </div>
            {paginationBlock && <div className="flex justify-end">{paginationBlock}</div>}
          </div>
        )}
      </div>

      {/* View toggle */}
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
    </>
  );
}
