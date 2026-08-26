'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Card, CardBody, Chip, Pagination, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Mail, Phone, Users } from 'lucide-react';
import { TurboyType } from '@/features/turboys/types/turboys.types';
import { useTurboyTable } from '@/features/turboys/hooks/use-turboy-table';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { TurboyActionsCell, getTurboyStatusColor, getTurboyStatusLabel } from './turboy-table-columns';
import { LivreurMobileCard, LivreurMobileCardList } from '@/components/dashboard/delivery-men/shared/livreur-mobile-card';

const TURBOY_TYPES: { value: TurboyType; label: string }[] = [
  { value: 'INDEPENDANT', label: 'Indépendant' },
  { value: 'JOURNALIER', label: 'Journalier' },
];

const getRowTypeClass = (typeLivreur?: TurboyType) => {
  if (typeLivreur === 'INDEPENDANT') {
    return 'bg-violet-50/70 dark:bg-violet-900/20 hover:bg-violet-100/70 dark:hover:bg-violet-900/30';
  }

  if (typeLivreur === 'JOURNALIER') {
    return 'bg-sky-50/70 dark:bg-sky-900/20 hover:bg-sky-100/70 dark:hover:bg-sky-900/30';
  }

  return 'hover:bg-gray-50 dark:hover:bg-gray-800/40';
};

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
    <div className="p-2 sm:p-4">
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
            Total: {turboysData?.livreurs?.totalElements || 0}
          </Chip>
        </div>
      </div>

      {/* Table Card — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
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
                turboysData.livreurs?.totalPages > 1 && (
                  <div className="flex justify-center p-4 border-t border-gray-200">
                    <Pagination
                      total={turboysData.livreurs.totalPages}
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
                      <TableRow key={row.id} className={getRowTypeClass(row.original.typeLivreur)}>
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

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden">
        <div className="mb-3">
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
        <LivreurMobileCardList>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun turboy trouvé.</p>
          ) : (
            table.getRowModel().rows.map((row) => {
              const t = row.original;
              const display = getTurboyTypeDisplay(t.typeLivreur);
              return (
                <LivreurMobileCard
                  key={row.id}
                  nom={`${t.prenoms} ${t.nom}`}
                  avatarUrl={t.avatarUrl}
                  sousTitre={
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {t.telephone || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {t.email || '-'}
                      </span>
                    </div>
                  }
                  statut={getTurboyStatusLabel(t.status)}
                  statutColor={getTurboyStatusColor(t.status)}
                  fields={[
                    { label: 'Genre', value: t.gender || '-' },
                    { label: 'Type', value: display.label },
                    { label: 'Salaire', value: t.salaire ? `${t.salaire.toLocaleString('fr-FR')} FCFA` : '-' },
                    { label: 'Commission', value: t.commission !== null && t.commission !== undefined ? `${t.commission} %` : '-' },
                    { label: 'Immatriculation', value: t.immatriculation || '-' },
                    { label: 'Matricule', value: t.matricule || '-' },
                  ]}
                  actions={<TurboyActionsCell turboy={t} />}
                />
              );
            })
          )}
        </LivreurMobileCardList>
        {turboysData && turboysData.livreurs?.totalPages > 1 && (
          <div className="flex justify-center pt-3">
            <Pagination
              total={turboysData.livreurs.totalPages}
              page={filters.page ? filters.page + 1 : 1}
              onChange={(page) => setFilters((prev) => ({ ...prev, page: page - 1 }))}
              color="primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
