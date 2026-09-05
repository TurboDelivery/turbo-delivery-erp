'use client';

import {
  Calendar,
  Chip,
  ComboBox,
  DateField,
  DatePicker,
  Input,
  Label,
  ListBox,
  Spinner,
  Table,
  Tooltip,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Gauge, Percent, UserCheck, UserX } from 'lucide-react';
import React from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import type { IRapportJour, IRapportPresence, IRapportSignal } from '@/features/reporting';
import { cn } from '@/lib/utils';
import { formatNombre } from '@/utils/format.utils';

/**
 * Le rapport de présence d'un livreur (RG-21) — le rendu, sans lecture.
 *
 * <h3>Ce qui change</h3>
 * <p>Le choix du livreur se faisait dans un `Select` : une liste déroulante de cent
 * soixante-cinq noms, sans champ de recherche, dans laquelle il fallait faire défiler
 * jusqu'au bon. C'est le premier geste de l'écran et il en était le plus coûteux. Il
 * devient un `ComboBox` — on tape trois lettres.</p>
 *
 * <p>Les deux bornes étaient des `<input type="date">` bruts. Ce sont des `DatePicker`.</p>
 *
 * <p>Le statut du jour s'affichait tel que le serveur l'envoie : « PRESENT », « LATE »,
 * « ABSENT » en capitales anglaises au milieu d'un tableau français. Il devient une
 * pastille avec son libellé, et les journées qui portent une anomalie — une pénalité ou
 * un pointage hors zone non justifié — se distinguent enfin de celles qui n'en portent
 * pas : c'est la seule chose qu'on vient chercher dans ce tableau.</p>
 */

const STATUT_JOUR: Record<string, { libelle: string; couleur: 'success' | 'warning' | 'danger' | 'default' }> = {
  ABSENT: { couleur: 'danger', libelle: 'Absent' },
  ABSENT_JUSTIFIE: { couleur: 'warning', libelle: 'Absence justifiée' },
  LATE: { couleur: 'warning', libelle: 'Retard' },
  PRESENT: { couleur: 'success', libelle: 'Présent' },
  REPOS: { couleur: 'default', libelle: 'Repos' },
  RETARD: { couleur: 'warning', libelle: 'Retard' },
};

/** Une journée porte une anomalie si elle coûte de l'argent ou n'est pas justifiée. */
function porteAnomalie(jour: IRapportJour): boolean {
  if (jour.penaliteFcfa) return true;
  const signaux = [jour.montee, jour.intermediaire, jour.intermediaire2, jour.fin].filter(
    (s): s is IRapportSignal => s != null,
  );
  return signaux.some((s) => (s.horsZone || s.conforme === false) && s.horsZoneJustifiee !== true);
}

function SignalCell({ signal }: { signal: IRapportSignal | null }) {
  if (!signal || !signal.heure) return <span className="text-muted">—</span>;
  const heure = (() => {
    try {
      return new Date(signal.heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return signal.heure;
    }
  })();
  // RG-29 : hors-zone explicite (jaune = justifié par ticket, rouge = non justifié) ;
  // repli sur `conforme === false` (distance) pour les anciennes données sans le flag.
  const horsZone = signal.horsZone || signal.conforme === false;
  const justifie = signal.horsZoneJustifiee === true;
  return (
    <span className="flex items-center gap-1">
      <span className="tabular-nums">{heure}</span>
      {horsZone && (
        <Tooltip>
          <Chip color={justifie ? 'warning' : 'danger'} size="sm" variant="soft">
            <Chip.Label>hors zone</Chip.Label>
          </Chip>
          <Tooltip.Content>
            {justifie ? 'Hors zone, justifié par un ticket' : 'Hors zone, non justifié'}
            {signal.distanceMetres != null &&
              ` — ${
                signal.distanceMetres >= 1000
                  ? `${(signal.distanceMetres / 1000).toFixed(1)} km`
                  : `${Math.round(signal.distanceMetres)} m`
              } du poste`}
          </Tooltip.Content>
        </Tooltip>
      )}
    </span>
  );
}

/** Synthèse hors-zone d'une journée : justifié (ticket) / non justifié (pénalité) / — (RG-29). */
function HorsZoneCell({ jour }: { jour: IRapportJour }) {
  const signaux = [jour.montee, jour.intermediaire, jour.intermediaire2, jour.fin].filter(
    (s): s is IRapportSignal => s != null,
  );
  const horsZone = signaux.filter((s) => s.horsZone || s.conforme === false);
  if (horsZone.length === 0) return <span className="text-muted">—</span>;
  const tousJustifies = horsZone.every((s) => s.horsZoneJustifiee === true);
  return (
    <Chip color={tousJustifies ? 'success' : 'danger'} size="sm" variant="soft">
      <Chip.Label>{tousJustifies ? 'Ticket joint — justifié' : 'Non justifié'}</Chip.Label>
    </Chip>
  );
}

function enDateCalendaire(iso: string): CalendarDate | null {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  return a && m && j ? new CalendarDate(a, m, j) : null;
}

/** Le champ de date de la bibliothèque, monté une fois et posé aux deux bornes. */
function ChampDate({
  label,
  onChange,
  valeur,
}: {
  label: string;
  onChange: (v: string) => void;
  valeur: string;
}) {
  return (
    <DatePicker
      className="w-44"
      onChange={(d: DateValue | null) => onChange(d ? d.toString() : '')}
      value={enDateCalendaire(valeur)}
    >
      <Label>{label}</Label>
      <DateField.Group>
        <DateField.Input>
          {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
            <DateField.Segment segment={segment} />
          )}
        </DateField.Input>
        <DatePicker.Trigger>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
      </DateField.Group>
      <DatePicker.Popover>
        <Calendar>
          <Calendar.Header>
            <Calendar.NavButton slot="previous">
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Calendar.NavButton>
            <Calendar.Heading />
            <Calendar.NavButton slot="next">
              <ChevronRight aria-hidden="true" className="size-4" />
            </Calendar.NavButton>
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(jour: string) => <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>{(date: CalendarDate) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

const COLONNES = ['jour', 'statut', 'montee', 'relance1', 'relance2', 'fin', 'horsZone', 'penalite'];

export interface VueRapportPresenceProps {
  /** Les livreurs proposés au choix, déjà nommés. */
  livreurs: { id: string; nom: string }[];
  livreursEnCours: boolean;
  livreurId: string | null;
  onLivreur: (v: string | null) => void;
  debut: string;
  onDebut: (v: string) => void;
  fin: string;
  onFin: (v: string) => void;
  rapport: IRapportPresence | undefined;
  isFetching: boolean;
  isError: boolean;
  onReessayer: () => void;
}

export function VueRapportPresence({
  livreurs,
  livreursEnCours,
  livreurId,
  onLivreur,
  debut,
  onDebut,
  fin,
  onFin,
  rapport,
  isFetching,
  isError: rapportEnErreur,
  onReessayer: rechargerRapport,
}: VueRapportPresenceProps) {

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        {/*
         * Un ComboBox et non un Select : la liste compte plus de cent soixante noms, et
         * la choisir en la faisant défiler était le geste le plus coûteux de l'écran.
         */}
        <ComboBox
          className="w-72"
          onSelectionChange={(c) => onLivreur(c ? String(c) : null)}
          selectedKey={livreurId}
        >
          <Label>Livreur</Label>
          <ComboBox.InputGroup>
            <Input placeholder={livreursEnCours ? 'Chargement…' : 'Rechercher un livreur…'} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox items={livreurs}>
              {(o: { id: string; nom: string }) => (
                <ListBox.Item id={o.id} textValue={o.nom}>
                  {o.nom}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        <ChampDate label="Du" onChange={onDebut} valeur={debut} />
        <ChampDate label="Au" onChange={onFin} valeur={fin} />
      </div>

      {!livreurId ? (
        <p className="py-10 text-center text-sm text-muted">
          Sélectionnez un livreur pour afficher son rapport.
        </p>
      ) : rapportEnErreur ? (
        // Sans ce branchement, un echec de lecture retombait sur "Aucun rapport pour ce
        // livreur", donc sur une absence de pointage la ou la donnee n'a pas pu etre lue.
        <EtatErreur
          enCours={isFetching}
          onReessayer={rechargerRapport}
          quoi="le rapport de présence"
        />
      ) : isFetching && !rapport ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <Spinner />
          <p className="text-sm text-muted">Chargement du rapport…</p>
        </div>
      ) : rapport ? (
        <>
          {/* Synthese : les couleurs passent par des tons et non par des classes de
              palette, pour que le retour du mode sombre ne demande aucune retouche. */}
          <GrilleStats colonnes={3}>
            <CarteStat
              icone={CalendarDays}
              libelle="Jours actifs"
              valeur={formatNombre(rapport.synthese.joursActifs)}
            />
            {/*
             * A zero, il n'y a rien a signaler : « Absents 0 » s'affichait en rouge et
             * « Retards 0 » en ambre, donc un mois parfait se lisait comme un mois a
             * problemes. Le ton ne se pose que lorsqu'il y a quelque chose a dire.
             */}
            <CarteStat
              icone={UserCheck}
              libelle="Présents"
              ton={rapport.synthese.presents > 0 ? 'succes' : 'neutre'}
              valeur={formatNombre(rapport.synthese.presents)}
            />
            <CarteStat
              icone={Clock}
              libelle="Retards"
              ton={rapport.synthese.retards > 0 ? 'attention' : 'neutre'}
              valeur={formatNombre(rapport.synthese.retards)}
            />
            <CarteStat
              icone={UserX}
              libelle="Absents"
              ton={rapport.synthese.absents > 0 ? 'danger' : 'neutre'}
              valeur={formatNombre(rapport.synthese.absents)}
            />
            {/*
             * L'assiduite portait le ton `primaire`, c'est-a-dire le rouge de marque :
             * 100 % s'affichait aussi alarmant que 12 %. Elle prend le ton de ce qu'elle
             * vaut, sur les memes seuils que la performance hebdomadaire.
             */}
            <CarteStat
              icone={Percent}
              libelle="Assiduité"
              ton={
                rapport.synthese.tauxAssiduite >= 80
                  ? 'succes'
                  : rapport.synthese.tauxAssiduite >= 50
                    ? 'attention'
                    : 'danger'
              }
              valeur={`${rapport.synthese.tauxAssiduite}%`}
            />
            <CarteStat
              icone={Gauge}
              libelle="Cote"
              valeur={rapport.cote != null ? `${rapport.cote}/100` : '—'}
            />
          </GrilleStats>

          {/* Détail par jour */}
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Détail par jour" className="min-w-[56rem]">
                <Table.Header>
                  <Table.Column id="jour" isRowHeader>
                    Jour
                  </Table.Column>
                  <Table.Column id="statut">Statut</Table.Column>
                  <Table.Column id="montee">Montée</Table.Column>
                  <Table.Column id="relance1">Relance 1</Table.Column>
                  <Table.Column id="relance2">Relance 2</Table.Column>
                  <Table.Column id="fin">Fin</Table.Column>
                  <Table.Column id="horsZone">Hors zone</Table.Column>
                  <Table.Column id="penalite">Pénalité</Table.Column>
                </Table.Header>

                <Table.Body
                  renderEmptyState={() =>
                    isFetching ? null : (
                      <p className="py-8 text-center text-sm text-muted">Aucun jour sur la période</p>
                    )
                  }
                >
                  {isFetching
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES.map((c) => (
                            <Table.Cell key={`sq-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isFetching ? [] : rapport.jours).map((j) => {
                    const s = STATUT_JOUR[(j.statutJour ?? '').toUpperCase()];
                    const anomalie = porteAnomalie(j);
                    return (
                      <Table.Row id={j.date} key={j.date}>
                        <Table.Cell>
                          <span className="whitespace-nowrap">
                            {(() => {
                              try {
                                return new Date(j.date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  weekday: 'short',
                                });
                              } catch {
                                return j.date;
                              }
                            })()}
                          </span>
                        </Table.Cell>

                        {/*
                         * Le statut arrivait tel quel du serveur : « PRESENT », « LATE »,
                         * en capitales anglaises au milieu d'un tableau francais.
                         */}
                        <Table.Cell>
                          {j.statutJour ? (
                            <Chip color={s?.couleur ?? 'default'} size="sm" variant="soft">
                              <Chip.Label>{s?.libelle ?? j.statutJour}</Chip.Label>
                            </Chip>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          <SignalCell signal={j.montee} />
                        </Table.Cell>
                        <Table.Cell>
                          <SignalCell signal={j.intermediaire} />
                        </Table.Cell>
                        <Table.Cell>
                          <SignalCell signal={j.intermediaire2} />
                        </Table.Cell>
                        <Table.Cell>
                          <SignalCell signal={j.fin} />
                        </Table.Cell>

                        <Table.Cell>
                          <HorsZoneCell jour={j} />
                        </Table.Cell>

                        {/* Ce que la journee a coute : le seul chiffre du tableau. */}
                        <Table.Cell>
                          <span
                            className={cn(
                              'block text-right tabular-nums',
                              anomalie && j.penaliteFcfa
                                ? 'font-semibold text-danger-soft-foreground'
                                : 'text-muted',
                            )}
                          >
                            {j.penaliteFcfa ? `${formatNombre(j.penaliteFcfa)} F` : '—'}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {/*
             * Le total des penalites etait dans le type mais nulle part a l'ecran : on
             * additionnait les journees de tete pour savoir ce que le mois avait coute.
             */}
            {!isFetching && rapport.jours.length > 0 && (
              <Table.Footer className="justify-between gap-4 text-sm">
                <span className="text-muted">
                  {rapport.jours.length} jour{rapport.jours.length > 1 ? 's' : ''} sur la période
                </span>
                <span className="text-muted">
                  Pénalités{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatNombre(rapport.synthese.totalPenalitesFcfa)} F
                  </span>
                </span>
              </Table.Footer>
            )}
          </Table>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-muted">Aucun rapport pour ce livreur.</p>
      )}
    </div>
  );
}
