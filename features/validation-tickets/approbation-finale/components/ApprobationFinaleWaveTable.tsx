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

  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Récapitulatif des virements Wave
        </p>
      </div>
      <HeroTable
        isStriped
        removeWrapper
        aria-label="Récapitulatif des virements Wave"
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
    </div>
  );
}
