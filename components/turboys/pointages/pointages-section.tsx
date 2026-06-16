'use client';

import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import { usePointagesLivreurQuery } from '@/features/turboys/queries/pointage.query';
import { useCoteQuery } from '@/features/turboys/queries/compte-livreur.queries';
import { IPointageRow, ISignalementPointage } from '@/features/turboys/types/pointage.types';
import { jourHorsZone, pointageColumns } from './pointages-table-columns';

const toIsoDay = (d: Date) => d.toISOString().split('T')[0];
const sigCsv = (s: ISignalementPointage | null) =>
  s?.pointeAt ? `${s.statut ?? ''} ${s.distanceMetres != null ? Math.round(s.distanceMetres) + 'm' : ''}`.trim() : '';

/**
 * Section « Pointages » de la fiche livreur (M3). Réutilise les semaines
 * d'emploi du temps (signalements) + la cote, filtrées par plage de dates côté
 * client. Colonnes : montée / relance 1 / relance 2 / fin / hors-zone + statut.
 */
export default function PointagesSection({ driverId }: { driverId: string }) {
  const { data, isLoading, isError } = usePointagesLivreurQuery(driverId);
  const { data: cote } = useCoteQuery(driverId);

  const today = new Date();
  const [debut, setDebut] = useState(() => toIsoDay(startOfMonth(today)));
  const [fin, setFin] = useState(() => toIsoDay(endOfMonth(today)));

  const rows = useMemo<IPointageRow[]>(() => {
    if (!data) return [];
    let d0: Date;
    let d1: Date;
    try {
      d0 = parseISO(debut);
      d1 = parseISO(fin);
    } catch {
      return [];
    }
    return data
      .flatMap((e) => (e.jours ?? []).map((j) => ({ ...j, emploiId: e.id })))
      .filter((j) => {
        if (!j.date) return false;
        try {
          return isWithinInterval(parseISO(j.date), { start: d0, end: d1 });
        } catch {
          return false;
        }
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // plus récent d'abord
  }, [data, debut, fin]);

  const table = useReactTable({ data: rows, columns: pointageColumns, getCoreRowModel: getCoreRowModel() });

  const synth = useMemo(() => {
    const present = rows.filter((r) => r.statutJour === 'PRESENT').length;
    const retard = rows.filter((r) => r.statutJour === 'RETARD').length;
    const absent = rows.filter((r) => r.statutJour === 'ABSENT').length;
    const horsZone = rows.filter(jourHorsZone).length;
    return { total: rows.length, present, retard, absent, horsZone };
  }, [rows]);

  function exporterCsv() {
    const entete = ['Date', 'Jour', 'Montée', 'Relance 1', 'Relance 2', 'Fin', 'Hors-zone', 'Statut'];
    const lignes = rows.map((r) =>
      [
        r.date,
        r.jour,
        sigCsv(r.startSignalement),
        sigCsv(r.midSignalement),
        sigCsv(r.endSignalement),
        r.fin ?? '',
        jourHorsZone(r) ? (r.absenceJustifiee ? 'Justifié' : 'Hors-zone') : '',
        r.statutJour ?? '',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(';'),
    );
    const blob = new Blob(['﻿' + [entete.join(';'), ...lignes].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pointages_${debut}_${fin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">Pointages</h3>
          <p className="text-xs text-gray-400">
            {synth.total} jour(s) · {synth.present} présents · {synth.retard} retards · {synth.absent} absents ·{' '}
            {synth.horsZone} hors-zone
            {cote?.cote != null && <> · cote {cote.cote}/100</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="text-gray-500">Du</label>
          <input
            type="date"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <label className="text-gray-500">au</label>
          <input
            type="date"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="sm" variant="outline" onClick={exporterCsv} disabled={rows.length === 0} className="gap-1.5">
            <Download className="size-3.5" /> CSV
          </Button>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-red-600">Erreur de chargement des pointages.</p>
      ) : (
        <Table aria-label="Pointages du livreur" isStriped removeWrapper>
          <TableHeader>
            {table.getFlatHeaders().map((h) => (
              <TableColumn key={h.id} className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={isLoading ? 'Chargement…' : 'Aucun pointage sur la période'}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
