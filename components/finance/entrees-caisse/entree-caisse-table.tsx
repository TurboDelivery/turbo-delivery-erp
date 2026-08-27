'use client';

import { flexRender } from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Pagination,
  Table as HeroTable,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import type { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';
import { ModifierEntreeCaisseModal } from '@/components/finance/entrees-caisse/modifier-entree-caisse-modal';
import { SupprimerEntreeCaisseModal } from '@/components/finance/entrees-caisse/supprimer-entree-caisse-modal';
import { formatMontant } from '@/utils/format.utils';

interface EntreeCaisseTableProps {
  table: Table<IEntreeCaisse>;
  isLoading: boolean;
  isFetching: boolean;
  pagination: {
    pageCount: number;
    page: number;
    handlePageChange: (page: number) => void;
  };
}

export function EntreeCaisseTable({
  table,
  isLoading,
  isFetching,
  pagination,
}: EntreeCaisseTableProps) {
  const colsCount = table.getAllColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <>
    <div className="hidden md:block overflow-x-auto">
      <HeroTable
        isStriped
        bottomContent={
          pagination.pageCount > 1 ? (
            <div className="flex justify-center pt-4">
              <Pagination
                total={pagination.pageCount}
                page={pagination.page + 1}
                onChange={pagination.handlePageChange}
                color="primary"
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id} className="text-primary">
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="Aucune entrée caisse trouvée">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: colsCount }).map((_, j) => (
                    <TableCell key={`cell-${j}`}>
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={isFetching ? 'opacity-70' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </HeroTable>
    </div>

    {/* Mobile — cartes tactiles (remplace le tableau < md) */}
    <div className={`md:hidden space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={`m-skel-${i}`} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
        ))
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Aucune entrée caisse trouvée</p>
      ) : (
        rows.map((row) => {
          const e = row.original;
          return (
            <div key={row.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 min-w-0 break-words">{e.libelle}</p>
                <span className="text-sm font-semibold text-gray-900 shrink-0">{formatMontant(e.montant)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">Date</span>
                <span className="text-sm text-gray-700">{format(new Date(e.dateEntree), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              {e.commentaire && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Commentaire</span>
                  <span className="text-sm text-gray-700 text-right break-words">{e.commentaire}</span>
                </div>
              )}
              <div className="pt-1 flex gap-2 justify-end">
                <ModifierEntreeCaisseModal entreeCaisse={e} />
                <SupprimerEntreeCaisseModal entreeCaisse={e} />
              </div>
            </div>
          );
        })
      )}
      {pagination.pageCount > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
        </div>
      )}
    </div>
    </>
  );
}
