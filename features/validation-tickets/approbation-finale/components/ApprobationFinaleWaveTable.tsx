'use client';

import { useEffect, useRef } from 'react';
import { flexRender, Table } from '@tanstack/react-table';
import { Table as HeroTable, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { IGrillePaiementLigne } from '@/features/validation-tickets/grille-de-paiement/types/grille-paiement.type';

interface Props {
  waveTable: Table<IGrillePaiementLigne>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export default function ApprobationFinaleWaveTable({ waveTable, isFetchingNextPage, hasNextPage, fetchNextPage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
      },
      { threshold: 0.1 },
    );
    // Observe les deux sentinelles (tableau desktop + liste mobile).
    if (bottomRef.current) observer.observe(bottomRef.current);
    if (bottomRefMobile.current) observer.observe(bottomRefMobile.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Récapitulatif des virements Wave
        </p>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <HeroTable
        isStriped
        removeWrapper
        aria-label="Récapitulatif des virements Wave"
        classNames={{ base: 'hidden md:block' }}
        bottomContent={
          <div ref={bottomRef} className="flex items-center justify-center py-2">
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
          </div>
        }
      >
        <TableHeader>
          {waveTable.getFlatHeaders().map((header) => (
            <TableColumn key={header.id} className="text-[10px] uppercase tracking-widest">
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="Aucun livreur trouvé">
          {waveTable.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </HeroTable>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {waveTable.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucun livreur trouvé</p>
        ) : (
          waveTable.getRowModel().rows.map((row) => {
            const ligne = row.original;
            return (
              <div
                key={row.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{ligne.turboy.nom}</p>
                  <p className="text-[11px] text-gray-400">{ligne.turboy.code}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">N° Wave</span>
                  {ligne.numeroWave ? (
                    <span className="text-right text-sm text-gray-600">{ligne.numeroWave}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Net</span>
                  <span className="text-right text-sm font-bold text-green-600">
                    {ligne.netAPayer.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRefMobile} className="flex items-center justify-center py-1">
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
        </div>
      </div>
    </div>
  );
}
