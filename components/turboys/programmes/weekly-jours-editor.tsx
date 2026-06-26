'use client';

import React from 'react';
import { Button, Input, Select, SelectItem, Switch, Tooltip } from '@heroui/react';
import { Copy } from 'lucide-react';
import { IJourProgramme } from '@/features/turboys/types/programme.types';

export interface OptionResto {
  id: string;
  nom: string;
}

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
  restaurants = [],
}: {
  value: IJourProgramme[];
  onChange: (jours: IJourProgramme[]) => void;
  disabled?: boolean;
  restaurants?: OptionResto[];
}) {
  const set = (jour: string, patch: Partial<IJourProgramme>) =>
    onChange(value.map((j) => (j.jour === jour ? { ...j, ...patch } : j)));

  // Recopie les horaires d'un jour vers tous les jours travaillés (actifs).
  const appliquerHorairesATous = (debut?: string | null, fin?: string | null) =>
    onChange(value.map((j) => (j.actif ? { ...j, debut: hhmm(debut), fin: hhmm(fin) } : j)));

  const nomResto = (id: string) => restaurants.find((r) => r.id === id)?.nom ?? id;

  return (
    <div className="space-y-2">
      {value.map((j) => (
        <div key={j.jour} className="space-y-2 rounded-lg border border-default-200 px-3 py-2">
          <div className="flex items-center gap-3">
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

            {j.actif ? (
              <Tooltip content="Appliquer ces horaires à tous les jours travaillés" size="sm">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  isDisabled={disabled}
                  aria-label="Appliquer ces horaires à tous les jours travaillés"
                  onPress={() => appliquerHorairesATous(j.debut, j.fin)}
                >
                  <Copy className="h-4 w-4 text-default-400" />
                </Button>
              </Tooltip>
            ) : (
              <span className="text-xs text-default-400">Repos</span>
            )}
          </div>

          {/* Maquette M2 — postes/partenaires desservis ce jour (jours travaillés). */}
          {j.actif && restaurants.length > 0 && (
            <Select
              size="sm"
              selectionMode="multiple"
              label="Postes / partenaires desservis"
              aria-label={`Postes ${LABEL[j.jour] ?? j.jour}`}
              isDisabled={disabled}
              selectedKeys={new Set((j.postes ?? []).map((p) => p.restaurantId))}
              onSelectionChange={(keys) =>
                set(j.jour, {
                  postes: Array.from(keys).map((id) => ({
                    restaurantId: String(id),
                    restaurantNom: nomResto(String(id)),
                  })),
                })
              }
            >
              {restaurants.map((r) => (
                <SelectItem key={r.id}>{r.nom}</SelectItem>
              ))}
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}
