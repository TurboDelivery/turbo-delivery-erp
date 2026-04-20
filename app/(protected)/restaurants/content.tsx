'use client';

import React from 'react';
import Link from 'next/link';
import { flexRender } from '@tanstack/react-table';
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
import { Download, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useRestaurantTable } from '@/features/restaurants/hooks/use-restaurant-table';

const TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Mensuel', value: 'MENSUEL' },
  { label: 'Quotidien', value: 'QUOTIDIEN' },
  { label: 'Hebdomadaire', value: 'HEBDOMADAIRE' },
  { label: 'Quinzaine', value: 'QUINZAINE' },
];

export default function Content() {
  const { table, isLoading, isFetching, pagination, filters, setSearch, setFilters } = useRestaurantTable();
  const colsCount = table.getAllColumns().length;

  return (
    <div className="w-full pb-10 flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Partenaires</h1>
        <div className="flex items-center gap-3">
          <Button variant="bordered" startContent={<Download className="w-4 h-4" />} size="sm">
            Exporter
          </Button>
          <Button color="primary" startContent={<Plus className="w-4 h-4" />} size="sm" as={Link} href="/restaurants/create">
            Créer un profil
          </Button>
        </div>
      </div>

      {/* ── Search + filter ── */}
      <div className="flex items-center gap-3">
        <Input
          className="flex-1"
          startContent={<Search className="text-gray-400 w-4 h-4 shrink-0" />}
          placeholder="Rechercher par nom, email ou localisation..."
          value={filters.search ?? ''}
          onChange={(e) => setSearch(e.target.value)}
          variant="bordered"
          size="sm"
        />
        <Button isIconOnly variant="bordered" size="sm" aria-label="Filtres" className="shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        </Button>
        <Select
          aria-label="Filtrer par type"
          className="w-44 shrink-0"
          selectedKeys={['']}
          size="sm"
          variant="bordered"
        >
          {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value}>{opt.label}</SelectItem>)}
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="relative rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Spinner color="primary" />
          </div>
        )}
        <Table
          aria-label="Liste des partenaires"
          removeWrapper
          classNames={{
            th: 'bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide',
            td: 'py-3',
          }}
          bottomContent={
            pagination && pagination.pageCount > 1 ? (
              <div className="flex justify-center py-3 border-t border-gray-100">
                <Pagination
                  total={pagination.pageCount}
                  page={pagination.page + 1}
                  onChange={pagination.handlePageChange}
                  isDisabled={isLoading}
                  showControls
                  color="primary"
                  variant="bordered"
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn
                key={header.id}
                allowsSorting={header.column.getCanSort()}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={isLoading ? ' ' : 'Aucun partenaire trouvé.'}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`sk-c-${j}`}>
                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
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
    </div>
  );
}
