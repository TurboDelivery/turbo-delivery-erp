'use client';

import {
  Button,
  Calendar,
  Chip,
  DateField,
  DatePicker,
  Label,
  Pagination,
  SearchField,
  Spinner,
  Table,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import React from 'react';

import type { IJournalActivite, IJournalFiltre, ModuleActivite } from '@/features/reporting';
import { MODULE_LABELS } from '@/features/reporting';

/**
 * Le journal transverse (RG-11) — le rendu, sans lecture.
 *
 * <h3>Ce qui change</h3>
 * <p>Les six modules étaient dans une liste déroulante à sélection multiple : pour savoir
 * ce qui était filtré, il fallait l'ouvrir. Six entrées tiennent sur une ligne — elles
 * deviennent un groupe de bascules, et le filtre actif se voit sans un clic.</p>
 *
 * <p>Les deux bornes étaient des `<input type="date">` bruts, la recherche un `Input` avec
 * une loupe posée à la main. Ce sont un `DatePicker` et un `SearchField`.</p>
 *
 * <p>Le libellé était tronqué derrière un `title=""` — invisible au clavier et sur
 * mobile. Il passe en info-bulle.</p>
 */

/*
 * Le module et le type d'auteur sont des ETIQUETTES, pas des etats : ils ne portent donc
 * aucune couleur. Six modules en six teintes, c'etaient six fois rien — et « Communication »
 * s'affichait en rouge, la couleur du danger, pour une categorie qui n'a rien d'alarmant.
 *
 * Le type d'auteur, lui, etait dit par la SEULE couleur d'une pastille : on ne pouvait pas
 * savoir si une ligne venait d'un agent, du livreur ou du systeme sans connaitre le code.
 * Il s'ecrit desormais.
 */
const AUTEUR_LIBELLE: Record<string, string> = {
  AGENT: 'agent',
  LIVREUR: 'livreur',
  SYSTEME: 'système',
};

const COLONNES = ['date', 'module', 'action', 'detail', 'auteur'];

function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
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

const MODULES = Object.keys(MODULE_LABELS) as ModuleActivite[];

export interface VueJournalProps {
  lignes: IJournalActivite[];
  totalPages: number;
  filtre: IJournalFiltre;
  setFiltre: React.Dispatch<React.SetStateAction<IJournalFiltre>>;
  isLoading: boolean;
  isFetching: boolean;
  exportEnCours: boolean;
  onExporter: () => void;
}

export function VueJournal({
  lignes,
  totalPages,
  filtre,
  setFiltre,
  isLoading,
  isFetching,
  exportEnCours,
  onExporter: handleExport,
}: VueJournalProps) {
  const patch = (p: Partial<IJournalFiltre>) => setFiltre((f) => ({ ...f, ...p, page: 0 }));

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const pageCourante = filtre.page + 1;

  return (
    <div className="flex flex-col gap-4">
      {/*
       * Les modules, en clair. Six entrées tiennent sur une ligne : les enfermer dans une
       * liste déroulante obligeait à l'ouvrir pour savoir ce qui était filtré.
       */}
      <ToggleButtonGroup
        // Six bascules sur une ligne font 552 px : elles debordaient la PAGE sur un
        // telephone de 375. Elles passent a la ligne.
        className="flex-wrap"
        onSelectionChange={(s) => patch({ module: Array.from(s) as ModuleActivite[] })}
        selectedKeys={new Set(filtre.module)}
        selectionMode="multiple"
      >
        {MODULES.map((m) => (
          <ToggleButton id={m} key={m}>
            {MODULE_LABELS[m]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <div className="flex flex-wrap items-end gap-3">
        <ChampDate label="Du" onChange={(v) => patch({ debut: v || null })} valeur={filtre.debut ?? ''} />
        <ChampDate label="Au" onChange={(v) => patch({ fin: v || null })} valeur={filtre.fin ?? ''} />

        <SearchField
          className="min-w-56 flex-1"
          onChange={(v) => patch({ keysearch: v })}
          value={filtre.keysearch}
        >
          <Label>Recherche</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Libellé ou auteur…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Button isPending={exportEnCours} onPress={handleExport} variant="outline">
          {exportEnCours ? <Spinner size="sm" /> : <Download aria-hidden="true" className="size-4" />}
          Exporter CSV
        </Button>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Journal d’activité" className="min-w-[56rem]">
            <Table.Header>
              <Table.Column id="date" isRowHeader>
                Date
              </Table.Column>
              <Table.Column id="module">Module</Table.Column>
              <Table.Column id="action">Action</Table.Column>
              <Table.Column id="detail">Détail</Table.Column>
              <Table.Column id="auteur">Auteur</Table.Column>
            </Table.Header>

            <Table.Body
              renderEmptyState={() =>
                isLoading || isFetching ? null : (
                  <p className="py-8 text-center text-sm text-muted">
                    Aucune activité pour ces critères.
                  </p>
                )
              }
            >
              {isLoading || isFetching
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                      {COLONNES.map((c) => (
                        <Table.Cell key={`sq-${i}-${c}`}>
                          <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                : null}

              {(isLoading || isFetching ? [] : lignes).map((l) => (
                <Table.Row id={l.id} key={l.id}>
                  <Table.Cell>
                    <span className="whitespace-nowrap tabular-nums text-muted">
                      {formatInstant(l.occurredAt)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Chip size="sm" variant="soft">
                      <Chip.Label>{MODULE_LABELS[l.module] ?? l.module}</Chip.Label>
                    </Chip>
                  </Table.Cell>

                  <Table.Cell>{l.action}</Table.Cell>

                  {/*
                   * Le libelle etait tronque derriere un `title=""` : invisible au clavier
                   * comme sur telephone. L'info-bulle le rend a tout le monde.
                   */}
                  <Table.Cell>
                    <Tooltip>
                      <span className="block max-w-md cursor-help truncate">{l.libelle}</span>
                      <Tooltip.Content className="max-w-[28rem]">{l.libelle}</Tooltip.Content>
                    </Tooltip>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="block truncate">{l.auteurNom ?? '—'}</span>
                    <span className="block text-xs text-muted">
                      {AUTEUR_LIBELLE[l.auteurType] ?? l.auteurType}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {totalPages > 1 && (
          <Table.Footer className="justify-center">
            <Pagination size="sm">
              <Pagination.Summary>
                Page {pageCourante} sur {totalPages}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={pageCourante === 1}
                    onPress={() => setFiltre((f) => ({ ...f, page: Math.max(0, f.page - 1) }))}
                  >
                    <Pagination.PreviousIcon />
                    Précédent
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === pageCourante}
                      onPress={() => setFiltre((f) => ({ ...f, page: p - 1 }))}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={pageCourante === totalPages}
                    onPress={() =>
                      setFiltre((f) => ({ ...f, page: Math.min(totalPages - 1, f.page + 1) }))
                    }
                  >
                    Suivant
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>
    </div>
  );
}
