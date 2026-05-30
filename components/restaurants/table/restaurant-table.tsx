'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { useRestaurantTable } from '@/features/restaurants/hooks/use-restaurant-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Pagination } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { RestaurantMobileCard, RestaurantMobileCardList } from '@/components/restaurants/restaurant-mobile-card';
import { StatusChip, ActionsMenu } from './restaurant-table-columns';

const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

export const RestaurantTable = () => {
  const { table, isLoading, isError, isFetching, pagination, filters, setSearch } = useRestaurantTable();

  const colsCount = table.getAllColumns().length;

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un restaurant..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tableau (desktop ≥ md) */}
      <div className="hidden md:block overflow-x-auto">
        <Table isStriped>
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn
                key={header.id}
                className="text-primary"
                allowsSorting={header.column.getCanSort()}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: colsCount }).map((_, j) => (
                    <TableCell key={`skeleton-cell-${j}`} className="h-12">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={colsCount} className="h-24 text-center">
                  <div className="text-destructive">Erreur lors du chargement des données</div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colsCount} className="h-24 text-center">
                  Aucun restaurant trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cartes (mobile < md) */}
      <RestaurantMobileCardList>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-card-${i}`} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : isError ? (
          <p className="text-sm text-destructive text-center py-10">Erreur lors du chargement des données</p>
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun restaurant trouvé</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const r = row.original;
            const isGratuite = r.typeCommission === 'GRATUIT';
            return (
              <RestaurantMobileCard
                key={r.id}
                nom={r.nomEtablissement}
                verified={r.status === 3 && !isGratuite}
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
      </RestaurantMobileCardList>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="flex justify-center pt-4 sm:pt-6">
          <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
        </div>
      )}
    </div>
  );
};


