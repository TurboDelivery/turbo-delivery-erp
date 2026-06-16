'use client';

import React from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { IProgramme } from '@/features/turboys/types/programme.types';
import {
  useProgrammesSemaineQuery,
  usePlanifierProgrammeMutation,
  usePublierProgrammeMutation,
} from '@/features/turboys/queries/programme.query';
import { buildProgrammeColumns } from './programmes-table-columns';
import { ProgrammeFormModal } from './programme-form-modal';

/**
 * Numéro de semaine ALIGNÉ sur le backend : `WeekFields.of(Locale.FRANCE).weekOfYear()`
 * (lundi = 1er jour, 4 jours min, ANNÉE CALENDAIRE) — exactement ce que calcule
 * `Utilitaire.recupererSemaineAnneeActuelle()` côté serveur, donc ce que le scheduler
 * et l'app considèrent comme « cette semaine ». Validé contre jshell sur les bornes
 * d'année (ex. 2027-01-01 → (2027, 0), 2025-12-29 → (2025, 53)). En milieu d'année,
 * identique à l'ISO ; ne diffère qu'autour du Nouvel An.
 */
function semaineCouranteBackend(): { annee: number; semaine: number } {
  const now = new Date();
  const annee = now.getFullYear();
  const start = Date.UTC(annee, 0, 1);
  const cur = Date.UTC(annee, now.getMonth(), now.getDate());
  const doy = Math.floor((cur - start) / 86400000) + 1;
  const dow = ((now.getDay() + 6) % 7) + 1; // 1 = lundi … 7 = dimanche
  const weekStart = (((doy - dow) % 7) + 7) % 7;
  const offset = weekStart + 1 > 4 ? 7 - weekStart : -weekStart;
  const semaine = Math.floor((7 + offset + (doy - 1)) / 7);
  return { annee, semaine };
}

const CURRENT_WEEK = semaineCouranteBackend();

export default function ProgrammesSection() {
  const [{ annee, semaine }, setWeek] = useQueryStates({
    annee: parseAsInteger.withDefault(CURRENT_WEEK.annee),
    semaine: parseAsInteger.withDefault(CURRENT_WEEK.semaine),
  });

  const { data, isLoading, isError } = useProgrammesSemaineQuery(annee, semaine);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IProgramme | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const planifier = usePlanifierProgrammeMutation();
  const publier = usePublierProgrammeMutation();

  const changeWeek = (delta: number) => {
    let s = semaine + delta;
    let a = annee;
    if (s < 1) {
      a -= 1;
      s = 52;
    } else if (s > 53) {
      a += 1;
      s = 1;
    }
    setWeek({ annee: a, semaine: s });
  };

  const runAction = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setPendingId(id);
    try {
      await fn(id);
    } catch {
      // erreur déjà signalée par le toast de la mutation
    } finally {
      setPendingId(null);
    }
  };

  const columns = buildProgrammeColumns({
    onEdit: (p) => setEditing(p),
    onPlanifier: (p) => runAction(p.id, planifier.mutateAsync),
    onPublier: (p) => runAction(p.id, publier.mutateAsync),
    pendingId,
  });

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="rounded-xl border border-default-200 bg-white p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Programmes hebdomadaires</h2>
          <p className="text-sm text-default-500">
            Planification des journaliers / superviseurs — semaine {semaine} / {annee}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" onPress={() => changeWeek(-1)}>
            ← Sem. préc.
          </Button>
          <Button size="sm" variant="flat" onPress={() => changeWeek(1)}>
            Sem. suiv. →
          </Button>
          <Button color="primary" onPress={() => setCreateOpen(true)}>
            Nouveau programme
          </Button>
        </div>
      </header>

      <Table aria-label="Programmes hebdomadaires" isStriped removeWrapper>
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody
          emptyContent={
            isLoading ? 'Chargement…' : isError ? 'Erreur de chargement des programmes' : 'Aucun programme pour cette semaine'
          }
        >
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ProgrammeFormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        anneeInitiale={annee}
        semaineInitiale={semaine}
      />
      <ProgrammeFormModal
        isOpen={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        programme={editing}
        anneeInitiale={annee}
        semaineInitiale={semaine}
      />
    </section>
  );
}
