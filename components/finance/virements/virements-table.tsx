'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Table } from '@heroui-v3/react';
import type { Table as TanstackTable } from '@tanstack/react-table';

import EtatErreur from '@/components/commons/EtatErreur';
import { IVirementRecu } from '@/features/virements';

interface VirementsTableProps {
  table: TanstackTable<IVirementRecu>;
  colonnes: number;
  chargement: boolean;
  enEchec: boolean;
  aucunPayeur: boolean;
}

/** Autant de cellules que de colonnes, dérivé de la table : un écart fait tomber la page. */
function LignesSquelette({ colonnes }: { colonnes: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, ligne) => (
        <Table.Row id={`squelette-${ligne}`} key={`squelette-${ligne}`}>
          {Array.from({ length: colonnes }).map((__, cellule) => (
            <Table.Cell key={`squelette-${ligne}-${cellule}`}>
              <div className="h-4 w-full animate-pulse rounded bg-muted/40" />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </>
  );
}

export function VirementsTable({
  table,
  colonnes,
  chargement,
  enEchec,
  aucunPayeur,
}: VirementsTableProps) {
  if (enEchec) {
    return (
      // ⚠ « les virements », pas « aucun virement » : une lecture qui échoue ne dit
      // pas que la caisse est vide, et c'est exactement la confusion qui ferait croire
      // à un opérateur que tout reste dû.
      <EtatErreur quoi="les virements reçus" />
    );
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Virements reçus" className="min-w-[52rem]">
          <Table.Header>
            {table.getFlatHeaders().map((header, index) => (
              <Table.Column id={header.id} isRowHeader={index === 0} key={header.id}>
                {header.isPlaceholder
                  ? ''
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </Table.Column>
            ))}
          </Table.Header>

          <Table.Body
            renderEmptyState={() =>
              chargement ? null : (
                <p className="py-10 text-center text-sm text-muted">
                  {aucunPayeur
                    ? 'Choisissez un payeur pour voir ses virements.'
                    : "Aucun virement enregistré pour ce payeur. Tant qu'il n'y en a pas, le relevé annonce que tout reste dû."}
                </p>
              )
            }
          >
            {chargement ? (
              <LignesSquelette colonnes={colonnes} />
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Row id={row.id} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
