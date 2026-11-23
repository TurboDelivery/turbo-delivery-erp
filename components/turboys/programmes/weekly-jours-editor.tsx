'use client';

import React from 'react';
import { Button, Checkbox, NumberField, Switch, TimeField, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { Time, parseTime } from '@internationalized/date';
import { CopyCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { ChampListeMultiple } from '@/components/commons/champs-formulaire';
import { IJourProgramme } from '@/features/turboys/types/programme.types';
import {
  anomaliesJours,
  dureeMinutes,
  finitApresMinuit,
} from '@/features/turboys/utils/jours-programme.utils';
import { lundiDeSemaine } from '@/features/turboys/utils/semaine.utils';

// Les calculs purs vivent dans jours-programme.utils, pour etre testes en node sans
// monter la bibliotheque de composants. On les re-exporte pour les appelants qui les
// prenaient ici.
export type { AnomalieJour } from '@/features/turboys/utils/jours-programme.utils';
export { anomaliesJours, dureeMinutes, finitApresMinuit } from '@/features/turboys/utils/jours-programme.utils';

export interface OptionResto {
  id: string;
  nom: string;
}

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const LABEL: Record<string, string> = {
  DIMANCHE: 'Dimanche',
  JEUDI: 'Jeudi',
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  SAMEDI: 'Samedi',
  VENDREDI: 'Vendredi',
};
const COURT: Record<string, string> = {
  DIMANCHE: 'Dim',
  JEUDI: 'Jeu',
  LUNDI: 'Lun',
  MARDI: 'Mar',
  MERCREDI: 'Mer',
  SAMEDI: 'Sam',
  VENDREDI: 'Ven',
};

/** 7 jours par défaut, tous au repos (actif = false). */
export function defaultJours(): IJourProgramme[] {
  return JOURS_ORDRE.map((jour) => ({ actif: false, date: null, debut: '08:00', fin: '18:00', jour }));
}

/**
 * Normalise une liste de jours reçue (complète les jours manquants, ordonne lun→dim).
 *
 * <p>Elle ne recopiait que cinq clés. Les POSTES d'un jour, saisis dans ce même éditeur,
 * n'y figuraient pas : ouvrir un programme pour le modifier les faisait disparaître du
 * formulaire, et l'enregistrer les effaçait. Chaque champ que l'éditeur sait saisir doit
 * aussi savoir revenir.</p>
 */
export function normaliserJours(jours: IJourProgramme[] | undefined | null): IJourProgramme[] {
  const parJour = new Map((jours ?? []).map((j) => [j.jour?.toUpperCase(), j]));
  return JOURS_ORDRE.map((jour) => {
    const existant = parJour.get(jour);
    return {
      actif: existant?.actif ?? false,
      date: existant?.date ?? null,
      debut: hhmm(existant?.debut) || '08:00',
      fin: hhmm(existant?.fin) || '18:00',
      jour,
      montantCarburant: existant?.montantCarburant ?? null,
      postes: existant?.postes ?? null,
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
const enTexte = (t: Time) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;

/**
 * Lundi (UTC) d'une semaine. Le nom dit ISO, la règle est celle du backend (FRANCE) : les
 * deux placent la semaine 1 sur le 4 janvier, et compter depuis ce lundi vaut aussi pour
 * les semaines 0 et 53 que l'ISO ne connaît pas. Délégué au calendrier commun.
 */
export function isoWeekMonday(year: number, week: number): Date {
  return lundiDeSemaine(year, week);
}

/** Affecte à chaque jour (ordre lun→dim) sa date calendaire dans la semaine. */
export function joursAvecDates(jours: IJourProgramme[], annee: number, semaine: number): IJourProgramme[] {
  const monday = isoWeekMonday(annee, semaine);
  return jours.map((j, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return { ...j, date: d.toISOString().slice(0, 10) };
  });
}

interface Props {
  basesGerees?: string[];
  disabled?: boolean;
  /** Tous les partenaires, pour le champ « Postes / partenaires desservis ». */
  restaurants?: OptionResto[];
  /** Les sites cochables d'un jour : le site de base d'abord, puis les sites desservis. */
  sitesDisponibles?: OptionResto[];
  sitesParJour: Record<string, string[]>;
  onChange: (jours: IJourProgramme[]) => void;
  onSitesParJourChange: (sites: Record<string, string[]>) => void;
  value: IJourProgramme[];
}

/**
 * L'éditeur de la semaine, en tableau compact (SPEC §6.5).
 *
 * <h3>Ce qui change, et pourquoi</h3>
 *
 * <p>C'étaient sept cartes hautes : trois jours et demi visibles, impossible de relire la
 * semaine d'un coup d'œil. Les sept jours tiennent désormais sur un écran de 1366 × 768,
 * un jour par ligne, et un jour de repos ne prend qu'une ligne grise au lieu d'une carte
 * de champs désactivés dont le libellé « Carburan » était tronqué.</p>
 *
 * <p>Les interrupteurs étaient ROUGES. Le rouge sert aussi aux alertes et au bouton de
 * suppression : un jour travaillé ressemblait à une erreur. Ils sont verts.</p>
 *
 * <p>Deux icônes sans libellé, une copie et une pompe, faisaient deux gestes différents
 * que rien n'expliquait. Un seul bouton les remplace, « Appliquer à toute la semaine »,
 * avec ses trois cases et un « Annuler » de quelques secondes (RG-S05).</p>
 *
 * <p>⚠ Ce n'est PAS un Table HeroUI, et c'est délibéré. Le Table v3 rend un
 * {@code role="grid"} où l'on navigue aux flèches : les flèches y seraient volées aux
 * champs d'heure et aux compteurs de montant, qui s'en servent pour incrémenter. Un
 * formulaire n'est pas une grille de données. Même raisonnement que l'exception déjà
 * documentée pour le compte de résultat.</p>
 */
export function WeeklyJoursEditor({
  basesGerees,
  disabled,
  onChange,
  onSitesParJourChange,
  restaurants = [],
  sitesDisponibles = [],
  sitesParJour,
  value,
}: Props) {
  // Le panneau « Appliquer à toute la semaine » ouvert, le cas échéant.
  const [applique, setApplique] = React.useState<string | null>(null);
  const [copier, setCopier] = React.useState({ carburant: true, horaires: true, repos: false, sites: true });
  const [memesPostes, setMemesPostes] = React.useState(() => postesIdentiques(value));

  const set = (jour: string, patch: Partial<IJourProgramme>) =>
    onChange(value.map((j) => (j.jour === jour ? { ...j, ...patch } : j)));

  const nomResto = (id: string) => restaurants.find((r) => r.id === id)?.nom ?? id;

  /**
   * RG-S05 : un seul geste copie horaires, carburant, sites et postes sur les autres
   * jours travaillés. Les jours de repos restent au repos, sauf case cochée.
   *
   * <p>⚠ Les SURPLUS ne sont jamais copiés (CA-37). Ils ne passent pas par ici : ils ne
   * sont pas dans {@code IJourProgramme}, précisément pour qu'aucun geste de masse ne
   * puisse les dupliquer par accident.</p>
   */
  const appliquerASemaine = (source: IJourProgramme) => {
    const avantJours = value;
    const avantSites = sitesParJour;

    const sitesSource = sitesParJour[source.jour] ?? [];
    const nouveauxJours = value.map((j) => {
      if (j.jour === source.jour) return j;
      if (!j.actif && !copier.repos) return j;
      const cible: IJourProgramme = { ...j, actif: true };
      if (copier.horaires) {
        cible.debut = source.debut;
        cible.fin = source.fin;
      }
      if (copier.carburant) {
        cible.montantCarburant = source.montantCarburant ?? null;
      }
      if (copier.sites) {
        cible.postes = source.postes ? source.postes.map((p) => ({ ...p })) : null;
      }
      return cible;
    });

    let nouveauxSites = sitesParJour;
    if (copier.sites) {
      nouveauxSites = { ...sitesParJour };
      for (const j of nouveauxJours) {
        if (j.jour === source.jour) continue;
        if (!j.actif) continue;
        nouveauxSites[j.jour] = [...sitesSource];
      }
    }

    onChange(nouveauxJours);
    onSitesParJourChange(nouveauxSites);
    setApplique(null);

    const quoi = [copier.horaires && 'horaires', copier.carburant && 'carburant', copier.sites && 'sites et postes']
      .filter(Boolean)
      .join(', ');
    toast.success(`${LABEL[source.jour]} appliqué à la semaine (${quoi}).`, {
      action: {
        label: 'Annuler',
        onClick: () => {
          onChange(avantJours);
          onSitesParJourChange(avantSites);
        },
      },
      duration: 8000,
    });
  };

  const anomalies = anomaliesJours(value, sitesParJour, sitesDisponibles.length);
  const anomaliesDe = (jour: string) => anomalies.filter((a) => a.jour === jour);

  // RG-V01 : chez un superviseur-livreur, les « sites du jour » sont ses bases gérées.
  const titreSites = basesGerees && basesGerees.length > 0 ? 'Bases du jour' : 'Sites du jour';

  return (
    <div className="flex flex-col gap-2">
      {/* §6.5 — « Mêmes postes tous les jours » au-dessus du tableau : le champ Postes
          était répété sept fois, vide, même quand les postes ne changent pas de la
          semaine. Coché, on les choisit une seule fois. */}
      {restaurants.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-secondary px-3 py-2">
          <Checkbox
            isDisabled={disabled}
            isSelected={memesPostes}
            onChange={(v) => {
              setMemesPostes(v);
              if (v) {
                const reference = value.find((j) => j.actif && (j.postes ?? []).length > 0);
                if (reference) {
                  onChange(value.map((j) => (j.actif ? { ...j, postes: reference.postes } : j)));
                }
              }
            }}
            slot={null}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="text-sm">Mêmes postes tous les jours</span>
            </Checkbox.Content>
          </Checkbox>
          {memesPostes && (
            <div className="min-w-[18rem] flex-1">
              <ChampListeMultiple
                label=""
                onChange={(ids) => {
                  const postes = ids.map((id) => ({ restaurantId: id, restaurantNom: nomResto(id) }));
                  onChange(value.map((j) => (j.actif ? { ...j, postes } : j)));
                }}
                options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                placeholder="Postes desservis toute la semaine"
                valeurs={(value.find((j) => j.actif)?.postes ?? []).map((p) => p.restaurantId)}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col divide-y divide-default rounded-md border border-default">
        {value.map((j) => {
          const erreurs = anomaliesDe(j.jour);
          const bloquante = erreurs.find((a) => a.bloquante);

          // §6.5 — un jour de repos tient sur UNE ligne grise, pas sur une carte de
          // champs désactivés. « Activer » reprend les valeurs du dernier jour travaillé.
          if (!j.actif) {
            return (
              <div className="flex items-center gap-3 bg-surface-secondary/60 px-3 py-2" key={j.jour}>
                <Switch
                  isDisabled={disabled}
                  isSelected={false}
                  onChange={() => activer(j, value, onChange)}
                  size="sm"
                >
                  <Switch.Content>
                    <span className="inline-block w-16 text-sm font-medium">{LABEL[j.jour]}</span>
                  </Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
                <span className="text-sm text-muted">Repos</span>
                <Button
                  className="ms-auto"
                  isDisabled={disabled}
                  onPress={() => activer(j, value, onChange)}
                  size="sm"
                  variant="ghost"
                >
                  Activer
                </Button>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-2 px-3 py-2" key={j.jour}>
              <div className="flex flex-wrap items-center gap-2">
                {/* §6.5 — l'interrupteur d'un jour travaillé est VERT. Il était rouge,
                    la couleur principale de l'ERP, qui sert aussi aux alertes et aux
                    suppressions : un jour de service ressemblait à une erreur. Le jeton
                    --switch-control-bg-checked est la voie documentée par HeroUI v3,
                    plutôt qu'une classe de couleur écrite en dur. Le vert et l'orange
                    sont aussi le vocabulaire de la légende de la liste (RG-L02). */}
                <Switch isDisabled={disabled} isSelected onChange={() => set(j.jour, { actif: false })} size="sm">
                  <Switch.Content>
                    <span className="inline-block w-16 text-sm font-medium">{LABEL[j.jour]}</span>
                  </Switch.Content>
                  <Switch.Control className="[--switch-control-bg-checked-hover:var(--success)] [--switch-control-bg-checked:var(--success)]">
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>

                <TimeField
                  aria-label={`Montée ${LABEL[j.jour]}`}
                  hourCycle={24}
                  isDisabled={disabled}
                  onChange={(v) => set(j.jour, { debut: v ? enTexte(v) : null })}
                  value={enHeure(j.debut)}
                >
                  <TimeField.Group className="w-[104px]">
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
                  aria-label={`Descente ${LABEL[j.jour]}`}
                  hourCycle={24}
                  isDisabled={disabled}
                  onChange={(v) => set(j.jour, { fin: v ? enTexte(v) : null })}
                  value={enHeure(j.fin)}
                >
                  <TimeField.Group className="w-[104px]">
                    <TimeField.Input>
                      {(segment: React.ComponentProps<typeof TimeField.Segment>['segment']) => (
                        <TimeField.Segment segment={segment} />
                      )}
                    </TimeField.Input>
                  </TimeField.Group>
                </TimeField>
                {finitApresMinuit(j) && (
                  <span className="text-xs font-medium text-muted" title="Le service finit après minuit">
                    +1
                  </span>
                )}

                <NumberField
                  aria-label={`Carburant ${LABEL[j.jour]}`}
                  formatOptions={{ maximumFractionDigits: 0 }}
                  isDisabled={disabled}
                  minValue={0}
                  onChange={(v) => set(j.jour, { montantCarburant: Number.isFinite(v) ? v : null })}
                  step={500}
                  value={j.montantCarburant ?? NaN}
                >
                  <NumberField.Group className="w-36">
                    <NumberField.DecrementButton />
                    <NumberField.Input className="text-end tabular-nums" placeholder="Carburant" />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>

                <Button
                  className="ms-auto"
                  isDisabled={disabled}
                  onPress={() => setApplique(applique === j.jour ? null : j.jour)}
                  size="sm"
                  variant="ghost"
                >
                  <CopyCheck aria-hidden="true" className="size-4" />
                  Appliquer à toute la semaine
                </Button>
              </div>

              {/* RG-S03 — les sites cochables du jour, base en premier. */}
              {sitesDisponibles.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 ps-1">
                  <span className="text-xs text-muted">{titreSites}</span>
                  <ToggleButtonGroup
                    isDisabled={disabled}
                    onSelectionChange={(s) =>
                      onSitesParJourChange({ ...sitesParJour, [j.jour]: Array.from(s).map(String) })
                    }
                    selectedKeys={new Set(sitesParJour[j.jour] ?? [])}
                    selectionMode="multiple"
                  >
                    {sitesDisponibles.map((s, i) => (
                      <ToggleButton id={s.id} key={s.id}>
                        {s.nom}
                        {i === 0 && !basesGerees?.length ? ' · base' : ''}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </div>
              )}

              {/* Postes du jour, seulement quand ils ne sont pas communs à la semaine. */}
              {!memesPostes && restaurants.length > 0 && (
                <div className="ps-1">
                  <ChampListeMultiple
                    label=""
                    onChange={(ids) =>
                      set(j.jour, {
                        postes: ids.map((id) => ({ restaurantId: id, restaurantNom: nomResto(id) })),
                      })
                    }
                    options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                    placeholder="Postes / partenaires desservis"
                    valeurs={(j.postes ?? []).map((p) => p.restaurantId)}
                  />
                </div>
              )}

              {/* Les contrôles s'affichent SUR la ligne concernée, pas en haut de fenêtre. */}
              {erreurs.length > 0 && (
                <p className={`ps-1 text-xs ${bloquante ? 'text-danger' : 'text-warning'}`}>
                  {erreurs.map((a) => a.message).join(' ')}
                </p>
              )}

              {applique === j.jour && (
                <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-secondary px-3 py-2">
                  <span className="text-xs font-medium">Copier sur les autres jours :</span>
                  {(
                    [
                      ['horaires', 'Horaires'],
                      ['carburant', 'Carburant'],
                      ['sites', 'Sites et postes'],
                      ['repos', 'Inclure les jours de repos'],
                    ] as const
                  ).map(([cle, libelle]) => (
                    <Checkbox
                      isSelected={copier[cle]}
                      key={cle}
                      onChange={(v) => setCopier((c) => ({ ...c, [cle]: v }))}
                      slot={null}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <span className="text-xs">{libelle}</span>
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                  <div className="ms-auto flex gap-2">
                    <Button onPress={() => setApplique(null)} size="sm" variant="ghost">
                      Annuler
                    </Button>
                    <Button
                      isDisabled={!copier.horaires && !copier.carburant && !copier.sites}
                      onPress={() => appliquerASemaine(j)}
                      size="sm"
                      variant="primary"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Appliquer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** « Activer » reprend les valeurs du dernier jour travaillé (§6.5). */
function activer(jour: IJourProgramme, tous: IJourProgramme[], onChange: (j: IJourProgramme[]) => void) {
  const modele = [...tous].reverse().find((j) => j.actif);
  onChange(
    tous.map((j) =>
      j.jour === jour.jour
        ? {
            ...j,
            actif: true,
            debut: modele?.debut ?? j.debut,
            fin: modele?.fin ?? j.fin,
            montantCarburant: modele?.montantCarburant ?? j.montantCarburant ?? null,
            postes: modele?.postes ? modele.postes.map((p) => ({ ...p })) : j.postes,
          }
        : j,
    ),
  );
}

/** Tous les jours travaillés portent-ils les mêmes postes ? Décide l'état initial de la case. */
function postesIdentiques(jours: IJourProgramme[]): boolean {
  const actifs = jours.filter((j) => j.actif);
  if (actifs.length < 2) return true;
  const cle = (j: IJourProgramme) =>
    (j.postes ?? [])
      .map((p) => p.restaurantId)
      .sort()
      .join('|');
  const premier = cle(actifs[0]);
  return actifs.every((j) => cle(j) === premier);
}
