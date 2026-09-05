'use client';

import React from 'react';
import { Button, Card, Switch, TimeField, Tooltip } from '@heroui-v3/react';
import { Time, parseTime } from '@internationalized/date';
import { Copy } from 'lucide-react';

import { ChampListeMultiple } from '@/components/commons/champs-formulaire';
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

/** « 08:30 » ou « 08:30:00 » vers une heure typee. Une valeur illisible vaut « pas d'heure ». */
const enHeure = (t?: string | null): Time | null => {
  const v = hhmm(t);
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  try {
    return parseTime(v);
  } catch {
    return null;
  }
};

/** L'inverse : le backend attend « HH:mm ». */
const enTexte = (t: Time) =>
  `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;

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
    <div className="flex flex-col gap-2">
      {value.map((j) => (
        <Card key={j.jour}>
          <Card.Content className="gap-2 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Switch
                isDisabled={disabled}
                isSelected={j.actif}
                onChange={(v) => set(j.jour, { actif: v })}
                size="sm"
              >
                <Switch.Content>
                  <span className="inline-block w-20 text-sm font-medium">
                    {LABEL[j.jour] ?? j.jour}
                  </span>
                </Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>

              {/*
               * `TimeField` et non un `<input type="time">` : la v2 laissait au navigateur
               * un champ dont la mise en forme change d'un poste a l'autre, et dont la
               * valeur remontait en texte libre — une saisie partielle comme « 8: » etait
               * enregistree telle quelle.
               */}
              <TimeField
                aria-label={`Début ${LABEL[j.jour] ?? j.jour}`}
                hourCycle={24}
                isDisabled={disabled || !j.actif}
                onChange={(v) => set(j.jour, { debut: v ? enTexte(v) : null })}
                value={enHeure(j.debut)}
              >
                <TimeField.Group className="max-w-[130px]">
                  <TimeField.Input>
                    {(segment: React.ComponentProps<typeof TimeField.Segment>['segment']) => (
                      <TimeField.Segment segment={segment} />
                    )}
                  </TimeField.Input>
                </TimeField.Group>
              </TimeField>
              <span aria-hidden="true" className="text-muted">
                →
              </span>
              <TimeField
                aria-label={`Fin ${LABEL[j.jour] ?? j.jour}`}
                hourCycle={24}
                isDisabled={disabled || !j.actif}
                onChange={(v) => set(j.jour, { fin: v ? enTexte(v) : null })}
                value={enHeure(j.fin)}
              >
                <TimeField.Group className="max-w-[130px]">
                  <TimeField.Input>
                    {(segment: React.ComponentProps<typeof TimeField.Segment>['segment']) => (
                      <TimeField.Segment segment={segment} />
                    )}
                  </TimeField.Input>
                </TimeField.Group>
              </TimeField>

              {j.actif ? (
                <Tooltip>
                  <Button
                    aria-label="Appliquer ces horaires à tous les jours travaillés"
                    isDisabled={disabled}
                    isIconOnly
                    onPress={() => appliquerHorairesATous(j.debut, j.fin)}
                    size="sm"
                    variant="ghost"
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </Button>
                  <Tooltip.Content>
                    Appliquer ces horaires à tous les jours travaillés
                  </Tooltip.Content>
                </Tooltip>
              ) : (
                <span className="text-xs text-muted">Repos</span>
              )}
            </div>

            {/* Maquette M2 — postes/partenaires desservis ce jour (jours travaillés). */}
            {j.actif && restaurants.length > 0 && (
              <ChampListeMultiple
                label="Postes / partenaires desservis"
                onChange={(ids) =>
                  set(j.jour, {
                    postes: ids.map((id) => ({
                      restaurantId: id,
                      restaurantNom: nomResto(id),
                    })),
                  })
                }
                options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                placeholder="Rechercher un partenaire"
                valeurs={(j.postes ?? []).map((p) => p.restaurantId)}
              />
            )}
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
