'use client';

import React from 'react';
import { Chip, ComboBox, Input, Label, ListBox, Select } from '@heroui-v3/react';
import { AlertTriangle, Check } from 'lucide-react';

import { formatNombre } from '@/utils/format.utils';
import {
  clefChoixZone,
  type IChoixZone,
  type IValeurDistincte,
} from '@/features/tickets/import/import-tickets.utils';

/**
 * Rattacher ce que le fichier écrit en toutes lettres à ce que la base connaît.
 *
 * <h3>Une question par VALEUR, pas par ligne</h3>
 * <p>Quatre cents lignes portent une quinzaine de noms de livreurs. La question se pose
 * donc une quinzaine de fois, triée par nombre de lignes concernées : ce qui engage le
 * plus se décide en premier, et ce qui n'engage qu'une ligne ne vient pas d'abord.</p>
 *
 * <h3>Ce qui est pré-rempli, et ce qui ne l'est pas</h3>
 * <p>Un nom n'est pré-rempli que s'il désigne UN SEUL compte. Mesuré en production :
 * parmi les 211 livreurs vivants, aucun homonyme chez ceux qui portent un nom, et aucun
 * homonyme du tout chez les 79 partenaires. Les correspondances se font donc presque
 * toutes seules — mais jamais par ressemblance approchante, qui confondrait « KOUAME
 * Yao » et « KOUAME Yaya » sans que personne ne le voie.</p>
 *
 * <h3>La zone, et pourquoi elle est ici</h3>
 * <p>Aucune feuille ne porte la zone, et le serveur l'exige. Elle se déduit du coût de
 * livraison, puisque c'est la zone qui le fixe. Sur les tickets réels des 90 derniers
 * jours, le prix désigne une seule zone deux fois sur trois. Quand il en désigne
 * plusieurs, l'écran dit si le choix déplace de l'argent : sur les 98 couples ambigus
 * de la grille, 95 portent la même commission, et seuls 3 en changent.</p>
 */

export interface IOptionRattachement {
  id: string;
  libelle: string;
  /** Rendu en gris et refusé : un compte désactivé fait refuser le ticket. */
  indisponible?: boolean;
  motifIndisponible?: string;
}

function LigneRattachement({
  choisi,
  onChoisir,
  options,
  valeur,
}: {
  choisi: string | undefined;
  onChoisir: (id: string) => void;
  options: IOptionRattachement[];
  valeur: IValeurDistincte;
}) {
  return (
    <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto_minmax(14rem,1fr)]">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground" title={valeur.valeur}>
          {valeur.valeur}
        </p>
      </div>
      <Chip color={choisi ? 'success' : 'warning'} size="sm" variant="soft">
        <Chip.Label className="tabular-nums">
          {formatNombre(valeur.occurrences)} ligne{valeur.occurrences > 1 ? 's' : ''}
        </Chip.Label>
      </Chip>
      <ComboBox
        allowsEmptyCollection
        aria-label={`Rattacher ${valeur.valeur}`}
        isInvalid={!choisi}
        onSelectionChange={(c) => onChoisir(String(c ?? ''))}
        selectedKey={choisi ?? null}
      >
        <ComboBox.InputGroup>
          <Input placeholder="Rechercher…" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            items={options}
            renderEmptyState={() => (
              <p className="px-3 py-2 text-sm text-muted">Aucun compte ne correspond</p>
            )}
          >
            {(o: IOptionRattachement) => (
              <ListBox.Item id={o.id} isDisabled={o.indisponible} textValue={o.libelle}>
                <span className={o.indisponible ? 'text-muted' : undefined}>
                  {o.libelle}
                  {o.motifIndisponible ? ` — ${o.motifIndisponible}` : ''}
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </div>
  );
}

function BlocRattachement({
  choix,
  onChoisir,
  options,
  titre,
  valeurs,
  vide,
}: {
  choix: Record<string, string>;
  onChoisir: (normalisee: string, id: string) => void;
  options: IOptionRattachement[];
  titre: string;
  valeurs: IValeurDistincte[];
  vide: string;
}) {
  const restants = valeurs.filter((v) => !choix[v.normalisee]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{titre}</h3>
        {valeurs.length === 0 ? null : restants.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Check aria-hidden className="size-3.5" />
            {formatNombre(valeurs.length)} rattaché{valeurs.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-warning">
            <AlertTriangle aria-hidden className="size-3.5" />
            {formatNombre(restants.length)} sur {formatNombre(valeurs.length)} à rattacher
          </span>
        )}
      </div>

      {valeurs.length === 0 ? (
        <p className="text-sm text-muted">{vide}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {valeurs.map((valeur) => (
            <LigneRattachement
              choisi={choix[valeur.normalisee]}
              key={valeur.normalisee}
              onChoisir={(id) => onChoisir(valeur.normalisee, id)}
              options={options}
              valeur={valeur}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BlocZones({
  choix,
  nomPartenaire,
  onChoisir,
  zones,
}: {
  choix: Record<string, string>;
  nomPartenaire: (id: string) => string;
  onChoisir: (clef: string, zoneId: string) => void;
  zones: IChoixZone[];
}) {
  const restants = zones.filter((z) => !choix[clefChoixZone(z.partenaireId, z.prix)]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Zones</h3>
        {zones.length === 0 ? null : restants.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Check aria-hidden className="size-3.5" />
            {formatNombre(zones.length)} couple{zones.length > 1 ? 's' : ''} résolu
            {zones.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-warning">
            <AlertTriangle aria-hidden className="size-3.5" />
            {formatNombre(restants.length)} sur {formatNombre(zones.length)} à choisir
          </span>
        )}
      </div>

      {zones.length === 0 ? (
        <p className="text-sm text-muted">
          Rattache d’abord les partenaires : les zones dépendent de leur grille tarifaire.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {zones.map((zone) => {
            const clef = clefChoixZone(zone.partenaireId, zone.prix);
            const choisie = choix[clef];
            return (
              <div
                className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto_minmax(14rem,1fr)]"
                key={clef}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {nomPartenaire(zone.partenaireId)} · {formatNombre(zone.prix)} FCFA
                  </p>
                  {zone.candidates.length === 0 ? (
                    <p className="text-xs text-danger">
                      Aucune zone à ce prix dans la grille de ce partenaire.
                    </p>
                  ) : zone.candidates.length === 1 ? (
                    <p className="text-xs text-muted">Une seule zone à ce prix.</p>
                  ) : zone.sansEffetSurLeMontant ? (
                    <p className="text-xs text-muted">
                      {zone.candidates.length} zones à ce prix, même commission : la
                      première est retenue, le choix ne change pas le montant.
                    </p>
                  ) : (
                    <p className="text-xs text-warning">
                      {zone.candidates.length} zones à ce prix, commissions différentes :
                      ce choix change le montant facturé.
                    </p>
                  )}
                </div>
                <Chip color={choisie ? 'success' : 'warning'} size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">
                    {formatNombre(zone.occurrences)} ligne{zone.occurrences > 1 ? 's' : ''}
                  </Chip.Label>
                </Chip>
                <Select
                  aria-label={`Zone pour ${formatNombre(zone.prix)} FCFA`}
                  isDisabled={zone.candidates.length === 0}
                  isInvalid={!choisie && zone.candidates.length > 0}
                  onSelectionChange={(k) => onChoisir(clef, String(k ?? ''))}
                  placeholder={zone.candidates.length === 0 ? 'Aucune' : 'Choisir…'}
                  selectedKey={choisie ?? null}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {zone.candidates.map((candidate) => (
                        <ListBox.Item
                          id={candidate.id}
                          key={candidate.id}
                          textValue={candidate.nom}
                        >
                          {candidate.nom}
                          {zone.sansEffetSurLeMontant
                            ? ''
                            : ` — commission ${formatNombre(candidate.commission)}`}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function EtapeReferences({
  choixLivreur,
  choixPartenaire,
  choixZone,
  grillesEnAttente,
  grillesEnEchec,
  livreurs,
  nomPartenaire,
  onChoisirLivreur,
  onChoisirPartenaire,
  onChoisirZone,
  partenaires,
  valeursLivreur,
  valeursPartenaire,
  zones,
}: {
  choixLivreur: Record<string, string>;
  choixPartenaire: Record<string, string>;
  choixZone: Record<string, string>;
  grillesEnAttente: boolean;
  /** Nombre de partenaires dont la grille tarifaire n'a PAS pu etre lue. */
  grillesEnEchec: number;
  livreurs: IOptionRattachement[];
  nomPartenaire: (id: string) => string;
  onChoisirLivreur: (normalisee: string, id: string) => void;
  onChoisirPartenaire: (normalisee: string, id: string) => void;
  onChoisirZone: (clef: string, zoneId: string) => void;
  partenaires: IOptionRattachement[];
  valeursLivreur: IValeurDistincte[];
  valeursPartenaire: IValeurDistincte[];
  zones: IChoixZone[];
}) {
  return (
    <div className="flex flex-col gap-5 rounded-large border border-separator bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
          4. Qui est qui
        </h2>
        <span className="text-xs text-muted">
          Une décision par valeur distincte, pas par ligne.
        </span>
      </div>

      <BlocRattachement
        choix={choixPartenaire}
        onChoisir={onChoisirPartenaire}
        options={partenaires}
        titre="Partenaires"
        valeurs={valeursPartenaire}
        vide="Aucun partenaire lu dans le fichier."
      />

      <BlocRattachement
        choix={choixLivreur}
        onChoisir={onChoisirLivreur}
        options={livreurs}
        titre="Livreurs"
        valeurs={valeursLivreur}
        vide="Aucun livreur lu dans le fichier."
      />

      {grillesEnAttente ? (
        <p className="text-sm text-muted">Lecture des grilles tarifaires…</p>
      ) : (
        <>
          {grillesEnEchec > 0 ? (
            /*
             * Sans ce bandeau, une panne de lecture se lit « Aucune zone à ce prix ».
             * Les deux se ressemblent à l'écran et ne veulent pas du tout dire la même
             * chose : l'une se corrige dans la grille tarifaire, l'autre en réessayant.
             */
            <div className="flex items-start gap-2 rounded-medium border border-danger/40 bg-danger/10 p-3">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="text-sm text-foreground">
                La grille tarifaire de {grillesEnEchec} partenaire
                {grillesEnEchec > 1 ? 's' : ''} n’a pas pu être lue. Les zones affichées
                ci-dessous sont incomplètes, et les lignes de ce
                {grillesEnEchec > 1 ? 's partenaires seront écartées' : ' partenaire seront écartées'}{' '}
                avant envoi. Ce n’est pas un problème de tarif : rechargez la page pour
                réessayer.
              </p>
            </div>
          ) : null}
          <BlocZones
            choix={choixZone}
            nomPartenaire={nomPartenaire}
            onChoisir={onChoisirZone}
            zones={zones}
          />
        </>
      )}
    </div>
  );
}
