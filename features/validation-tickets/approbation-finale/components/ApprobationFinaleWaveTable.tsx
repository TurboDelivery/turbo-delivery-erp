'use client';

import { useEffect, useRef } from 'react';
import { flexRender, Table } from '@tanstack/react-table';
import { Card, Spinner } from '@heroui-v3/react';
import { Table as HeroTable, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
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
    <div className="flex-1 min-w-0 rounded-xl border border-separator bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-separator">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
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
          /* Le rond de chargement etait dessine a la main (`Loader2` + `animate-spin`) :
             sa couleur etait figee et ne suivait pas la bascule de theme. `Spinner` en
             `color="current"` herite du `text-muted` porte par la sentinelle. */
          <div ref={bottomRef} className="flex items-center justify-center py-2 text-muted">
            {isFetchingNextPage && <Spinner color="current" size="sm" />}
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
          <p className="py-10 text-center text-sm text-muted">Aucun livreur trouvé</p>
        ) : (
          waveTable.getRowModel().rows.map((row) => {
            const ligne = row.original;
            return (
              /*
               * Le cadre etait un `div` habille a la main (fond, bordure, arrondi, ombre,
               * rembourrage). C'est une carte de la bibliotheque : elle porte ce cadre et
               * suit le theme sans qu'on le redise. Ne reste que l'ecart entre les lignes.
               */
              <Card key={row.id} className="gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{ligne.turboy.nom}</p>
                  <p className="text-[11px] text-muted">{ligne.turboy.code}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">N° Wave</span>
                  {ligne.numeroWave ? (
                    <span className="text-right text-sm tabular-nums text-muted">{ligne.numeroWave}</span>
                  ) : (
                    <span className="text-right text-sm text-muted">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Net</span>
                  {/* `text-green-600` etait ecrit en dur, sans variante sombre : depuis que la
                      bascule de theme est dans l'en-tete, le montant a virer restait vert clair
                      sur fond fonce, illisible au moment de verifier une paie. `text-success-soft-foreground`
                      porte le meme sens et a ses deux themes. */}
                  <span className="text-right text-sm font-bold tabular-nums text-success-soft-foreground">
                    {ligne.netAPayer.toLocaleString('fr-FR')}
                  </span>
                </div>
              </Card>
            );
          })
        )}
        <div ref={bottomRefMobile} className="flex items-center justify-center py-1 text-muted">
          {isFetchingNextPage && <Spinner color="current" size="sm" />}
        </div>
      </div>
    </div>
  );
}
