'use client';

import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button, Table } from '@heroui-v3/react';
import { Download } from 'lucide-react';

import { ChampTexte } from '@/components/commons/champs-formulaire';
import EtatErreur from '@/components/commons/EtatErreur';
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
  const { data, isError, isFetching, isLoading, refetch } = usePointagesLivreurQuery(driverId);
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
        sigCsv(r.mid2Signalement),
        sigCsv(r.endSignalement),
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

  const mesures = [
    { libelle: 'Jours', valeur: synth.total },
    { libelle: 'Présents', valeur: synth.present },
    { libelle: 'Retards', valeur: synth.retard },
    { libelle: 'Absents', valeur: synth.absent },
    { libelle: 'Hors-zone', valeur: synth.horsZone },
    ...(cote?.cote != null ? [{ libelle: 'Cote', valeur: `${cote.cote}/100` }] : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-separator bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          {/* Le titre etait peint en ROUGE DE MARQUE. */}
          <h3 className="text-base font-semibold text-foreground">Pointages</h3>
          {/*
           * La synthese etait une phrase a puces : « 24 jour(s) · 18 presents · 3 retards ·
           * 2 absents · 1 hors-zone · cote 74/100 ». Six chiffres a la file, en petit et en
           * gris, qu'il fallait relire pour trouver celui qu'on cherchait. Ce sont six
           * mesures : elles s'alignent, et se comparent d'une periode a l'autre.
           */}
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {mesures.map((m) => (
              <div className="flex flex-col" key={m.libelle}>
                <dt className="text-xs tracking-wide text-muted uppercase">{m.libelle}</dt>
                <dd className="text-lg font-bold tabular-nums text-foreground">{m.valeur}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {/*
           * C'etaient deux `<input type="date">` nus, avec leurs classes de bordure et
           * d'anneau de focus ecrites a la main, et deux `<label>` « Du » / « au » qui
           * n'etaient RATTACHES a aucun des deux champs : au lecteur d'ecran, deux champs
           * de date sans nom.
           */}
          <div className="w-40">
            <ChampTexte label="Du" onChange={setDebut} type="date" valeur={debut} />
          </div>
          <div className="w-40">
            <ChampTexte label="Au" onChange={setFin} type="date" valeur={fin} />
          </div>
          <Button
            isDisabled={rows.length === 0}
            onPress={exporterCsv}
            size="sm"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* L'echec etait une phrase en `text-red-600`, sans moyen de relancer : le seul
          recours etait de recharger la page. */}
      {isError ? (
        <EtatErreur enCours={isFetching} onReessayer={() => void refetch()} quoi="les pointages" />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Pointages du livreur">
              <Table.Header>
                {table.getFlatHeaders().map((h, i) => (
                  <Table.Column
                    className="text-xs font-semibold uppercase"
                    id={h.id}
                    isRowHeader={i === 0}
                    key={h.id}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucun pointage sur la période
                    </p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {table.getAllColumns().map((c) => (
                          <Table.Cell key={`sq-${i}-${c.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <Table.Row id={row.id} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell className="py-2" key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </section>
  );
}
