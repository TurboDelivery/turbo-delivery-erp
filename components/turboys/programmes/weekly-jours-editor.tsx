'use client';

import React from 'react';
import { Input, Switch } from '@heroui/react';
import { IJourProgramme } from '@/features/turboys/types/programme.types';

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const LABEL: Record<string, string> = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
  DIMANCHE: 'Dimanche',
};

/** 7 jours par défaut, tous au repos (actif = false). */
export function defaultJours(): IJourProgramme[] {
  return JOURS_ORDRE.map((jour) => ({ jour, actif: false, debut: '08:00', fin: '18:00', date: null }));
}

/** Normalise une liste de jours reçue (complète les jours manquants, ordonne lun→dim). */
export function normaliserJours(jours: IJourProgramme[] | undefined | null): IJourProgramme[] {
  const parJour = new Map((jours ?? []).map((j) => [j.jour?.toUpperCase(), j]));
  return JOURS_ORDRE.map((jour) => {
    const existant = parJour.get(jour);
    return {
      jour,
      actif: existant?.actif ?? false,
      debut: hhmm(existant?.debut) || '08:00',
      fin: hhmm(existant?.fin) || '18:00',
      date: existant?.date ?? null,
    };
  });
}

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** Lundi (UTC) de la semaine ISO donnée. ISO : la semaine 1 contient le 4 janvier. */
export function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7; // lundi = 0
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

/** Affecte à chaque jour (ordre lun→dim) sa date calendaire dans la semaine ISO. */
export function joursAvecDates(jours: IJourProgramme[], annee: number, semaine: number): IJourProgramme[] {
  const monday = isoWeekMonday(annee, semaine);
  return jours.map((j, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return { ...j, date: d.toISOString().slice(0, 10) };
  });
}

export function WeeklyJoursEditor({
  value,
  onChange,
  disabled,
}: {
  value: IJourProgramme[];
  onChange: (jours: IJourProgramme[]) => void;
  disabled?: boolean;
}) {
  const set = (jour: string, patch: Partial<IJourProgramme>) =>
    onChange(value.map((j) => (j.jour === jour ? { ...j, ...patch } : j)));

  return (
    <div className="space-y-2">
      {value.map((j) => (
        <div
          key={j.jour}
          className="flex items-center gap-3 rounded-lg border border-default-200 px-3 py-2"
        >
          <Switch
            size="sm"
            isSelected={j.actif}
            isDisabled={disabled}
            onValueChange={(v) => set(j.jour, { actif: v })}
          >
            <span className="inline-block w-20 text-sm font-medium">{LABEL[j.jour] ?? j.jour}</span>
          </Switch>

          <Input
            type="time"
            size="sm"
            aria-label={`Début ${LABEL[j.jour] ?? j.jour}`}
            value={hhmm(j.debut)}
            isDisabled={disabled || !j.actif}
            onValueChange={(v) => set(j.jour, { debut: v })}
            className="max-w-[130px]"
          />
          <span className="text-default-400">→</span>
          <Input
            type="time"
            size="sm"
            aria-label={`Fin ${LABEL[j.jour] ?? j.jour}`}
            value={hhmm(j.fin)}
            isDisabled={disabled || !j.actif}
            onValueChange={(v) => set(j.jour, { fin: v })}
            className="max-w-[130px]"
          />

          {!j.actif && <span className="text-xs text-default-400">Repos</span>}
        </div>
      ))}
    </div>
  );
}
