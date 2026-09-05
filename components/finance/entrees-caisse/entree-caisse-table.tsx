'use client';

import { flexRender } from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Table as HeroTable } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { cn } from '@/lib/utils';
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
    <Card className="hidden md:block">
      <Card.Content className="p-0">
        <HeroTable>
          <HeroTable.ScrollContainer>
            <HeroTable.Content aria-label="Entrées caisse" className="min-w-[44rem]">
              <HeroTable.Header>
                {table.getFlatHeaders().map((header, i) => (
                  <HeroTable.Column id={header.id} isRowHeader={i === 0} key={header.id}>
                    {header.isPlaceholder
                      ? ''
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </HeroTable.Column>
                ))}
              </HeroTable.Header>

              <HeroTable.Body
                renderEmptyState={() =>
                  isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucune entrée caisse trouvée
                    </p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <HeroTable.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {table.getFlatHeaders().map((h) => (
                          <HeroTable.Cell key={`sq-${i}-${h.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </HeroTable.Cell>
                        ))}
                      </HeroTable.Row>
                    ))
                  : null}

                {(isLoading ? [] : rows).map((row) => (
                  <HeroTable.Row id={row.id} key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <HeroTable.Cell className={cn(isFetching && 'opacity-70')} key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </HeroTable.Cell>
                    ))}
                  </HeroTable.Row>
                ))}
              </HeroTable.Body>
            </HeroTable.Content>
          </HeroTable.ScrollContainer>

          {pagination.pageCount > 1 && (
            <HeroTable.Footer className="justify-center">
              <PaginationTableau
                onPage={pagination.handlePageChange}
                page={pagination.page + 1}
                total={pagination.pageCount}
              />
            </HeroTable.Footer>
          )}
        </HeroTable>
      </Card.Content>
    </Card>

    {/* Mobile — cartes tactiles (remplace le tableau < md) */}
    <div className={cn('flex flex-col gap-3 md:hidden', isFetching && 'opacity-70')}>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={`m-skel-${i}`} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />
        ))
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Aucune entrée caisse trouvée</p>
      ) : (
        rows.map((row) => {
          const e = row.original;
          return (
            <Card key={row.id}>
              <Card.Content className="gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{e.libelle}</p>
                <span className="text-sm font-semibold text-foreground shrink-0">{formatMontant(e.montant)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Date</span>
                <span className="text-sm text-foreground">{format(new Date(e.dateEntree), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              {e.commentaire && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted shrink-0">Commentaire</span>
                  <span className="text-sm text-foreground text-right wrap-break-word">{e.commentaire}</span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <ModifierEntreeCaisseModal entreeCaisse={e} />
                <SupprimerEntreeCaisseModal entreeCaisse={e} />
              </div>
              </Card.Content>
            </Card>
          );
        })
      )}
      {pagination.pageCount > 1 && (
        <div className="flex justify-center pt-2">
          <PaginationTableau
            onPage={pagination.handlePageChange}
            page={pagination.page + 1}
            total={pagination.pageCount}
          />
        </div>
      )}
    </div>
    </>
  );
}
