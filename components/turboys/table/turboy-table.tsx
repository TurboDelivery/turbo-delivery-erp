'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Card, CardBody, Chip, Pagination, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Users } from 'lucide-react';
import { TurboyType } from '@/features/turboys/types/turboys.types';
import { useTurboyTable } from '@/features/turboys/hooks/use-turboy-table';

const TURBOY_TYPES: { value: TurboyType; label: string }[] = [
  { value: 'INDEPENDANT', label: 'Indépendant' },
  { value: 'JOURNALIER', label: 'Journalier' },
];

export function TurboyTable() {
  const { table, isLoading, turboysData, filters, setFilters } = useTurboyTable();

  const handleTypeFilterChange = (keys: any) => {
    const selected = Array.from(keys)[0] as TurboyType;
    void setFilters((prev) => ({
      ...prev,
      typeLivreur: selected || undefined,
    }));
  };

  return (
    <div className="min-h-screen p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Turboys</h1>
            <p className="text-xs sm:text-sm text-gray-500">Gestion des livreurs et prestataires</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip variant="flat" color="primary" size="lg">
            Total: {turboysData?.totalElements || 0}
          </Chip>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <Table
              isStriped
              topContent={
                <div className="w-full sm:w-48">
                  <Select
                    items={TURBOY_TYPES}
                    selectedKeys={filters.typeLivreur ? [filters.typeLivreur] : []}
                    onSelectionChange={handleTypeFilterChange}
                    placeholder="Filtrer par type"
                    className="w-full"
                    size="sm"
                  >
                    {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
                  </Select>
                </div>
              }
              bottomContent={
                turboysData &&
                turboysData.totalPages > 1 && (
                  <div className="flex justify-center p-4 border-t border-gray-200">
                    <Pagination
                      total={turboysData.totalPages}
                      page={filters.page ? filters.page + 1 : 1}
                      onChange={(page) =>
                        setFilters((prev) => ({
                          ...prev,
                          page: page - 1,
                        }))
                      }
                      color="primary"
                    />
                  </div>
                )
              }
            >
              <TableHeader>
                {table.getFlatHeaders().map((header) => (
                  <TableColumn key={header.id} className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent={isLoading ? 'Chargement des turboys...' : 'Aucun turboy trouvé.'}>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: table.getAllColumns().length }).map((_, j) => (
                          <TableCell key={`skeleton-cell-${j}`} className="h-12">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-2 py-1 text-xs whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
