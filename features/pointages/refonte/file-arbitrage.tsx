'use client';

import {
  Button,
  Calendar,
  Card,
  Chip,
  ComboBox,
  DateField,
  DatePicker,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Disclosure,
  Separator,
  Spinner,
  Table,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { ChevronLeft, ChevronRight, MapPin, SlidersHorizontal } from 'lucide-react';
import React from 'react';

import { type IPointageHorsZone, TYPE_POINTAGE_LABEL, type TypePointage, VALIDATION_LABEL } from '@/features/pointages-validation/pointages-validation.api';
import { cn } from '@/lib/utils';

/**
 * La file d'arbitrage des pointages hors zone, refondue.
 *
 * <h3>Ce que l'écran demandait de faire, et ce qu'il coûtait</h3>
 * <p>On y tranche, un par un, des pointages faits loin du poste : valider, c'est compter
 * une présence normale ; rejeter, c'est appliquer une pénalité de cote sur le livreur.
 * Une décision qui engage. Elle se prenait pourtant sur un tableau de DIX colonnes, où
 * les trois éléments qui fondent le jugement étaient les plus maltraités : la distance
 * tenait dans une colonne étroite, le motif du livreur était TRONQUÉ derrière un
 * `title=""`, et la preuve photo était un lien « Voir » qui ouvrait un onglet. On
 * arbitrait donc sans lire la justification ni regarder la photo.</p>
 *
 * <h3>Les trois questions, et ce qu'elles changent</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : le nombre de décisions qui attendent, et la
 *       première d'entre elles. C'était une puce à droite d'un titre, après six filtres.</li>
 *   <li><b>Ce qui appelle une action</b> : « Valider » et « Rejeter », rien d'autre. Tout
 *       le reste est une PIÈCE du dossier — distance, motif, photo, coordonnées — et une
 *       pièce se montre entière, pas tronquée à deux cents pixels.</li>
 *   <li><b>La forme de la donnée</b> : une file de décisions n'est pas un tableau. Un
 *       tableau sert à COMPARER des lignes ; ici chaque cas se juge seul, sur des pièces
 *       hétérogènes. La file devient donc une suite de dossiers. L'historique, lui, se
 *       parcourt et se compare : il RESTE un tableau, sous la file.</li>
 * </ul>
 *
 * <h3>Ce qui apparaît, et qui n'existait pas</h3>
 * <p>La photo de preuve, en vignette, au lieu d'un lien. Le motif en entier. Et les
 * COORDONNÉES : `latitude` et `longitude` étaient reçues à chaque ligne et jetées. « À
 * 1,4 km du poste » ne dit rien tant qu'on ignore si c'est la rue d'à côté ou un autre
 * quartier ; le lien vers la carte le dit.</p>
 */

export interface FileArbitrageProps {
  pointages: IPointageHorsZone[];
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  onReessayer?: () => void;
  /** Valider : le pointage compte comme une présence normale. */
  onValider: (p: IPointageHorsZone) => void;
  /** Rejeter : la pénalité de cote s'applique, le motif part dans l'historique. */
  onRejeter: (p: IPointageHorsZone, motif: string) => void;
  /** Clé du dossier en cours d'écriture, pour n'occuper QUE ses deux boutons. */
  cleEnCours?: string | null;
  /** Borne basse de la fenêtre serveur (aaaa-mm-jj). Sa modification relit le registre. */
  depuis: string;
  onDepuis: (v: string) => void;
  /** Résout le chemin d'une preuve en URL affichable. */
  urlPreuve: (chemin: string) => string;
}

/** L'identité d'un pointage : l'emploi, le jour et le signalement. */
export const clePointage = (p: IPointageHorsZone) => `${p.emploiId}-${p.date}-${p.type}`;

const SIGNALEMENTS: { cle: 'TOUS' | TypePointage; libelle: string }[] = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'START', libelle: 'Montée' },
  { cle: 'MID', libelle: 'Relance 1' },
  { cle: 'MID2', libelle: 'Relance 2' },
  { cle: 'END', libelle: 'Fin de service' },
];

/*
 * Le ton de la distance. Il n'est pas décoratif : c'est le premier tri du jugement.
 * En deçà de deux cents mètres on est encore devant l'établissement — un GPS urbain
 * dérive de cet ordre-là. Au-delà d'un kilomètre, on est ailleurs.
 */
function tonDistance(m: number | null): string {
  if (m === null) return 'text-muted';
  if (m >= 1000) return 'text-danger-soft-foreground';
  if (m >= 200) return 'text-warning-soft-foreground';
  return 'text-foreground';
}

function distanceLisible(m: number | null): string {
  if (m === null) return 'distance inconnue';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function jourLisible(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', weekday: 'short' });
}

function heureLisible(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function enDateCalendaire(iso: string): CalendarDate | null {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  return a && m && j ? new CalendarDate(a, m, j) : null;
}

/** Le champ de date de la bibliothèque, monté une fois et posé aux deux bornes. */
function ChampDate({ label, onChange, valeur }: { label: string; onChange: (v: string) => void; valeur: string }) {
  return (
    <DatePicker onChange={(d: DateValue | null) => onChange(d ? d.toString() : '')} value={enDateCalendaire(valeur)}>
      <Label>{label}</Label>
      <DateField.Group>
        <DateField.Input>{(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => <DateField.Segment segment={segment} />}</DateField.Input>
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
            <Calendar.GridHeader>{(jour: string) => <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>}</Calendar.GridHeader>
            <Calendar.GridBody>{(date: CalendarDate) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

export function FileArbitrage({
  pointages,
  isLoading = false,
  isError = false,
  isFetching = false,
  onReessayer,
  onValider,
  onRejeter,
  cleEnCours = null,
  depuis,
  onDepuis,
  urlPreuve,
}: FileArbitrageProps) {
  const [recherche, setRecherche] = React.useState('');
  const [restaurant, setRestaurant] = React.useState('TOUS');
  const [signalement, setSignalement] = React.useState<'TOUS' | TypePointage>('TOUS');
  const [jusqua, setJusqua] = React.useState('');
  const [statutHistorique, setStatutHistorique] = React.useState<'TOUS' | 'VALIDE' | 'REJETE'>('TOUS');

  const [rejet, setRejet] = React.useState<IPointageHorsZone | null>(null);
  const [motif, setMotif] = React.useState('');
  const [agrandie, setAgrandie] = React.useState<IPointageHorsZone | null>(null);

  /** Les établissements observés : il n'existe pas de référentiel dédié côté serveur. */
  const restaurants = React.useMemo(() => {
    const noms = new Set<string>();
    for (const p of pointages) if (p.restaurant) noms.add(p.restaurant);
    return ['TOUS', ...Array.from(noms).sort()];
  }, [pointages]);

  /* Les filtres portent sur les DEUX sections : on cherche un livreur, pas un statut. */
  const retenus = React.useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return pointages.filter((p) => {
      if (q && !(p.livreur ?? '').toLowerCase().includes(q)) return false;
      if (restaurant !== 'TOUS' && p.restaurant !== restaurant) return false;
      if (signalement !== 'TOUS' && p.type !== signalement) return false;
      if (jusqua && p.date > jusqua) return false;
      return true;
    });
  }, [pointages, recherche, restaurant, signalement, jusqua]);

  const enAttente = React.useMemo(() => retenus.filter((p) => p.validation === 'EN_ATTENTE'), [retenus]);

  const historique = React.useMemo(
    () =>
      retenus
        .filter((p) => p.validation !== 'EN_ATTENTE')
        .filter((p) => statutHistorique === 'TOUS' || p.validation === statutHistorique)
        .sort((a, b) => (b.valideAt ?? b.date).localeCompare(a.valideAt ?? a.date)),
    [retenus, statutHistorique],
  );

  /* Combien de filtres sont posés : le déclencheur replié doit le dire. */
  const nbFiltres = (recherche.trim() ? 1 : 0) + (restaurant !== 'TOUS' ? 1 : 0) + (signalement !== 'TOUS' ? 1 : 0) + (jusqua ? 1 : 0) + (depuis ? 1 : 0);
  const filtreActif = nbFiltres > 0;

  /* « Tout effacer » : il n'existait aucun moyen de revenir au registre entier. */
  const effacerFiltres = () => {
    setRecherche('');
    setRestaurant('TOUS');
    setSignalement('TOUS');
    setJusqua('');
    onDepuis('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/*
       * CE QU'IL RESTE A TRANCHER, EN PREMIER, avec la consequence de chaque geste.
       * Le compte etait une puce grise a droite du titre, apres six filtres ; la
       * consequence, elle, n'etait ecrite nulle part au moment de decider.
       */}
      <Card className={cn(enAttente.length > 0 && 'border-accent/30 bg-accent-soft/25')}>
        <Card.Content className="gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums text-foreground">{isError || isLoading ? '—' : enAttente.length}</span>
              <span className="text-sm text-muted">
                {enAttente.length > 1 && !isLoading && !isError ? 'décisions' : 'décision'} en attente
                {filtreActif && ' sur ces critères'}
              </span>
            </div>
            {isFetching && !isLoading && <Spinner size="sm" />}
          </div>

          <p className="text-sm text-muted">
            Valider compte le pointage comme une présence normale — une montée validée fait entrer le livreur dans la file d’attente. Rejeter applique la pénalité de cote.
          </p>
        </Card.Content>
      </Card>

      {/*
       * LES FILTRES, une fois, pour les deux sections — et REPLIES.
       *
       * <p>Ils etaient six, en tete d'ecran, avant meme de savoir s'il y avait quelque
       * chose a trancher. Au telephone ils occupaient l'ecran entier : on faisait
       * defiler une page de filtres pour atteindre la premiere decision. Ils
       * s'ouvrent quand on en a besoin, et le declencheur dit combien sont poses —
       * une liste raccourcie ne surprend plus.</p>
       */}
      {/*
       * Volontairement NON CONTROLE : le repli n'est lu nulle part ailleurs, et la
       * version controlee s'ouvrait toute seule au montage — `onExpandedChange`
       * remontait un `true` que rien n'avait demande. Sans etat a nous, la
       * bibliotheque garde le sien, et le panneau s'ouvre au clic, pas avant.
       */}
      <Disclosure>
        <Disclosure.Heading>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" slot="trigger" variant="outline">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {nbFiltres > 0 ? `Filtres (${nbFiltres})` : 'Filtrer'}
              <Disclosure.Indicator />
            </Button>
            {nbFiltres > 0 && (
              <Button onPress={effacerFiltres} size="sm" variant="ghost">
                Tout effacer
              </Button>
            )}
          </div>
        </Disclosure.Heading>

        <Disclosure.Content>
          <Disclosure.Body className="pt-3">
            <Card>
              <Card.Content className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <SearchField className="lg:col-span-2" onChange={setRecherche} value={recherche}>
                  <Label>Livreur</Label>
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Rechercher un livreur…" />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>

                {/*
                 * Des ComboBox et non des Select : la liste des etablissements se
                 * construit sur les pointages recus et depasse la centaine certains
                 * mois. Dans ce projet, tout ce qui est une liste se cherche.
                 */}
                <ComboBox onSelectionChange={(c) => setRestaurant(String(c ?? 'TOUS'))} selectedKey={restaurant}>
                  <Label>Établissement</Label>
                  <ComboBox.InputGroup>
                    <Input placeholder="Tous" />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox items={restaurants.map((r) => ({ cle: r }))}>
                      {(o: { cle: string }) => (
                        <ListBox.Item id={o.cle} textValue={o.cle === 'TOUS' ? 'Tous' : o.cle}>
                          {o.cle === 'TOUS' ? 'Tous' : o.cle}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>

                <ComboBox onSelectionChange={(c) => setSignalement(String(c ?? 'TOUS') as 'TOUS' | TypePointage)} selectedKey={signalement}>
                  <Label>Signalement</Label>
                  <ComboBox.InputGroup>
                    <Input placeholder="Tous" />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox items={SIGNALEMENTS}>
                      {(o: (typeof SIGNALEMENTS)[number]) => (
                        <ListBox.Item id={o.cle} textValue={o.libelle}>
                          {o.libelle}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>

                {/*
                 * Deux bornes qui ne font PAS la meme chose, et l'ecran doit le dire :
                 * « Depuis » commande la fenetre lue par le serveur et relance la
                 * lecture, « Jusqu'au » filtre ce qui est deja la.
                 */}
                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <ChampDate label="Depuis" onChange={onDepuis} valeur={depuis} />
                  <ChampDate label="Jusqu’au" onChange={setJusqua} valeur={jusqua} />
                </div>
              </Card.Content>
            </Card>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>

      {/* ── LA FILE : un dossier par decision, pas une ligne de tableau ─────────── */}
      {isError ? (
        <Card>
          <Card.Content className="items-center gap-3 py-10 text-center">
            <p className="text-sm text-foreground">Les pointages n’ont pas pu être lus.</p>
            {onReessayer && (
              <Button isPending={isFetching} onPress={onReessayer} size="sm" variant="outline">
                {isFetching ? 'Lecture…' : 'Réessayer'}
              </Button>
            )}
          </Card.Content>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" key={`sq-${i}`} />
          ))}
        </div>
      ) : enAttente.length === 0 ? (
        <Card>
          <Card.Content className="items-center py-10 text-center">
            <p className="text-sm text-muted">{filtreActif ? 'Aucune décision en attente sur ces critères.' : 'Aucune décision en attente. Le registre ci-dessous garde les décisions déjà prises.'}</p>
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {enAttente.map((p) => {
            const cle = clePointage(p);
            const enCours = cleEnCours === cle;
            const heure = heureLisible(p.pointeAt);
            return (
              <Card key={cle}>
                <Card.Content className="gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-base font-semibold text-foreground">{p.livreur ?? 'Livreur inconnu'}</span>
                      <Chip size="sm" variant="soft">
                        <Chip.Label>{TYPE_POINTAGE_LABEL[p.type] ?? p.type}</Chip.Label>
                      </Chip>
                    </div>
                    <span className="text-sm text-muted">
                      {jourLisible(p.date)}
                      {heure && ` · ${heure}`}
                      {p.restaurant && ` · ${p.restaurant}`}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      {/*
                       * LA PREUVE, EN VIGNETTE. C'etait un lien « Voir » vers un
                       * autre onglet : on tranchait sans l'avoir ouvert.
                       */}
                      {p.preuveUrl && (
                        <Button aria-label="Agrandir la preuve" className="size-24 shrink-0 overflow-hidden p-0" isIconOnly onPress={() => setAgrandie(p)} variant="outline">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={`Preuve fournie par ${p.livreur ?? 'le livreur'}`} className="size-full object-cover" src={urlPreuve(p.preuveUrl)} />
                        </Button>
                      )}

                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className={cn('text-lg font-semibold tabular-nums', tonDistance(p.distanceMetres))}>{distanceLisible(p.distanceMetres)}</span>
                          <span className="text-sm text-muted">du poste</span>

                          {/*
                           * `latitude` et `longitude` etaient recues a chaque
                           * ligne et jetees. « A 1,4 km » ne dit rien tant
                           * qu'on ignore OU.
                           */}
                          {p.latitude !== null && p.longitude !== null && (
                            <Button
                              onPress={() => window.open(`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`, '_blank', 'noopener,noreferrer')}
                              size="sm"
                              variant="ghost"
                            >
                              <MapPin aria-hidden="true" className="size-4" />
                              Voir sur la carte
                            </Button>
                          )}
                        </div>

                        {/* Le motif ENTIER. Il etait tronque a deux cents pixels. */}
                        <p className="whitespace-pre-line text-sm text-foreground">
                          {p.motif?.trim() ? <>« {p.motif.trim()} »</> : <span className="text-muted">Aucun motif saisi par le livreur.</span>}
                        </p>
                      </div>
                    </div>

                    {/* Au telephone les deux gestes prennent la largeur : la cible tactile
                        ne depend plus de la longueur du motif. */}
                    <div className="flex shrink-0 gap-2">
                      <Button
                        className="flex-1 lg:flex-none"
                        isPending={enCours}
                        onPress={() => {
                          setMotif('');
                          setRejet(p);
                        }}
                        variant="outline"
                      >
                        Rejeter
                      </Button>
                      <Button className="flex-1 lg:flex-none" isPending={enCours} onPress={() => onValider(p)} variant="primary">
                        {enCours ? <Spinner size="sm" /> : null}
                        Valider
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── L'HISTORIQUE : la, un tableau est la bonne forme ────────────────────── */}
      <Card>
        <Card.Content className="gap-3 p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
            <span className="text-sm font-semibold text-foreground">Décisions déjà prises</span>
            <ToggleButtonGroup
              onSelectionChange={(s) => {
                const v = Array.from(s)[0];
                if (v) setStatutHistorique(String(v) as 'TOUS' | 'VALIDE' | 'REJETE');
              }}
              selectedKeys={new Set([statutHistorique])}
              selectionMode="single"
            >
              <ToggleButton id="TOUS">Toutes</ToggleButton>
              <ToggleButton id="VALIDE">Validées</ToggleButton>
              <ToggleButton id="REJETE">Rejetées</ToggleButton>
            </ToggleButtonGroup>
          </div>

          <Table>
            <Table.ScrollContainer className="max-h-[28rem] overflow-y-auto">
              <Table.Content aria-label="Historique des décisions d’arbitrage" className="min-w-[52rem]">
                <Table.Header>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="livreur" isRowHeader>
                    Livreur
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="quand">
                    Pointage
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="distance">
                    Distance
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="motif">
                    Motif du livreur
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="decision">
                    Décision
                  </Table.Column>
                </Table.Header>

                <Table.Body
                  /*
                   * Un echec de lecture ne se dit pas « aucune decision » :
                   * c'est exactement le message d'un registre vide, et
                   * l'equipe en conclurait qu'il n'y a rien a voir. La faute
                   * avait deja ete commise sur cet ecran, elle est nommee dans
                   * l'ancien fichier.
                   */
                  renderEmptyState={() =>
                    isLoading ? null : <p className="py-8 text-center text-sm text-muted">{isError ? 'Le registre n’a pas pu être lu.' : 'Aucune décision sur ces critères.'}</p>
                  }
                >
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Table.Row id={`sqh-${i}`} key={`sqh-${i}`}>
                          {Array.from({ length: 5 }).map((__, c) => (
                            <Table.Cell key={`sqh-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isError || isLoading ? [] : historique).map((p) => (
                    <Table.Row id={clePointage(p)} key={clePointage(p)}>
                      <Table.Cell>
                        <span className="block max-w-[14rem] truncate">{p.livreur ?? '—'}</span>
                        {p.restaurant && <span className="block max-w-[14rem] truncate text-xs text-muted">{p.restaurant}</span>}
                      </Table.Cell>

                      <Table.Cell>
                        <span className="block">{jourLisible(p.date)}</span>
                        <span className="block text-xs text-muted">
                          {TYPE_POINTAGE_LABEL[p.type] ?? p.type}
                          {heureLisible(p.pointeAt) && ` · ${heureLisible(p.pointeAt)}`}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        <span className={cn('block text-right tabular-nums', tonDistance(p.distanceMetres))}>{p.distanceMetres === null ? '—' : distanceLisible(p.distanceMetres)}</span>
                      </Table.Cell>

                      {/*
                       * Le motif reste ecourte ICI — on parcourt l'historique,
                       * on ne le juge plus — mais il est lisible en entier
                       * dans l'info-bulle, et non plus derriere un `title`
                       * que le clavier n'atteint jamais.
                       */}
                      <Table.Cell>
                        {p.motif?.trim() ? (
                          <Tooltip>
                            <span className="block max-w-[18rem] cursor-help truncate">{p.motif}</span>
                            <Tooltip.Content className="max-w-[22rem]">{p.motif}</Tooltip.Content>
                          </Tooltip>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex flex-col items-start gap-1">
                          {/*
                           * `color` porte l'echelle semantique, `variant`
                           * l'intensite : c'est la convention deja posee
                           * par `VisaDgaStatutBadge`. Le libelle reste
                           * ecrit, l'etat ne tient jamais qu'a la couleur.
                           */}
                          <Chip color={p.validation === 'VALIDE' ? 'success' : 'danger'} size="sm" variant="primary">
                            <Chip.Label>{VALIDATION_LABEL[p.validation]}</Chip.Label>
                          </Chip>
                          <span className="text-xs text-muted">
                            {p.arbitre ?? 'Décision d’avant la refonte'}
                            {p.valideAt && ` · ${new Date(p.valideAt).toLocaleDateString('fr-FR')}`}
                          </span>
                          {p.commentaireValidation && <span className="max-w-[16rem] text-xs text-muted">{p.commentaireValidation}</span>}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Rejet : le motif est obligatoire, il part dans l'historique de cote du livreur. */}
      <Modal isOpen={rejet !== null} onOpenChange={(o) => !o && setRejet(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Rejeter le pointage</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <p className="text-sm text-muted">
                  {rejet?.livreur} — {rejet ? TYPE_POINTAGE_LABEL[rejet.type] : ''} du {rejet ? jourLisible(rejet.date) : ''}. Le rejet applique la pénalité de cote ; le motif est visible dans son
                  historique.
                </p>
                <TextField autoFocus onChange={setMotif} value={motif}>
                  <Label>Motif du rejet</Label>
                  <Input placeholder="Pourquoi ce pointage est refusé" />
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setRejet(null)} variant="ghost">
                  Annuler
                </Button>
                <Button
                  isDisabled={!motif.trim()}
                  isPending={rejet !== null && cleEnCours === clePointage(rejet)}
                  onPress={() => {
                    if (!rejet || !motif.trim()) return;
                    onRejeter(rejet, motif.trim());
                    setRejet(null);
                  }}
                  variant="danger"
                >
                  Rejeter le pointage
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* La preuve en grand, sans quitter l'ecran ni perdre la file. */}
      <Modal isOpen={agrandie !== null} onOpenChange={(o) => !o && setAgrandie(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  Preuve — {agrandie?.livreur ?? 'livreur'}, {agrandie ? jourLisible(agrandie.date) : ''}
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body>
                {agrandie?.preuveUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`Preuve fournie par ${agrandie.livreur ?? 'le livreur'}`} className="max-h-[70vh] w-full rounded-lg object-contain" src={urlPreuve(agrandie.preuveUrl)} />
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
