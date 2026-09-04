'use client';

import {
    DateField,
    DateRangePicker,
    RangeCalendar,
    Separator,
    ToggleButton,
    ToggleButtonGroup,
} from '@heroui-v3/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import type { DateValue } from 'react-aria-components/Calendar';


/**
 * Selecteur de periode : trois raccourcis, et une plage libre.
 *
 * <p>L'ecran precedent n'offrait QUE la plage libre — un calendrier a deux mois qu'il
 * fallait ouvrir et regler a chaque fois, meme pour la question la plus courante :
 * « et ce mois-ci ? ». Les raccourcis repondent aux trois questions qu'on pose neuf fois
 * sur dix ; le calendrier reste la pour la dixieme, et rien n'est perdu.</p>
 *
 * <p>Composants HeroUI v3 : `DateRangePicker` pour la plage et `RangeCalendar` pour la
 * grille, plutot que le `DateRangePicker` v2 de l'ancien `DateFilterInput`.</p>
 */

export type Raccourci = 'mois' | 'annee' | 'origine' | 'libre';

interface SelecteurPeriodeProps {
    raccourci: Raccourci;
    onRaccourci: (r: Raccourci) => void;
    /** Plage courante, pour le calendrier. */
    plage: { start: DateValue; end: DateValue } | null;
    onPlage: (p: { start: DateValue; end: DateValue } | null) => void;
    /** Texte de la periode active, affiche sur le declencheur. */
    libelle: string;
}

const RACCOURCIS: { cle: Raccourci; libelle: string }[] = [
    { cle: 'mois', libelle: 'Ce mois' },
    { cle: 'annee', libelle: 'Cette année' },
    { cle: 'origine', libelle: "Depuis l'origine" },
];

export function SelecteurPeriode({
    raccourci,
    onRaccourci,
    plage,
    onPlage,
    libelle,
}: SelecteurPeriodeProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-separator p-1">
                {/* `ToggleButtonGroup` v3 plutot que des <button> nus : il porte l'etat
                    selectionne, la navigation au clavier et les roles ARIA du groupe. */}
                <ToggleButtonGroup
                    onSelectionChange={(cles) => {
                        const premiere = [...cles][0];
                        if (premiere) onRaccourci(premiere as Raccourci);
                    }}
                    selectedKeys={new Set([raccourci])}
                    selectionMode="single"
                >
                    {RACCOURCIS.map((r) => (
                        <ToggleButton id={r.cle} key={r.cle} size="sm">
                            {r.libelle}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <Separator className="mx-0.5 h-5" orientation="vertical" />

                {/*
                 * Composition attendue par le composant, sans habillage de ma part.
                 *
                 * Le popover ne s'ancre PAS sur le declencheur mais sur le GROUPE DE
                 * SAISIE : c'est lui que react-aria enregistre comme reference de
                 * positionnement. Sans `DateInputGroup`, cette reference reste nulle et
                 * le calendrier s'ouvrait dans le coin superieur gauche de la page —
                 * mesure a l'ecran, popover en (0,0) alors que le bouton etait en (807,114).
                 * Retirer mes classes n'y avait rien change : la cause etait structurelle.
                 *
                 * Au passage on y gagne de vrais champs de date, saisissables au clavier
                 * segment par segment, que mon bouton textuel ne permettait pas.
                 */}
                <DateRangePicker onChange={onPlage} value={plage}>
                    <DateField.Group>
                        <DateField.Input slot="start">
                            {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                                <DateField.Segment segment={segment} />
                            )}
                        </DateField.Input>
                        <DateRangePicker.RangeSeparator />
                        <DateField.Input slot="end">
                            {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                                <DateField.Segment segment={segment} />
                            )}
                        </DateField.Input>
                        <DateRangePicker.Trigger>
                            <CalendarDays aria-hidden="true" className="size-4" />
                        </DateRangePicker.Trigger>
                    </DateField.Group>

                    <DateRangePicker.Popover>
                        <RangeCalendar>
                            <RangeCalendar.Header>
                                <RangeCalendar.NavButton slot="previous">
                                    <ChevronLeft aria-hidden="true" className="size-4" />
                                </RangeCalendar.NavButton>
                                <RangeCalendar.Heading />
                                <RangeCalendar.NavButton slot="next">
                                    <ChevronRight aria-hidden="true" className="size-4" />
                                </RangeCalendar.NavButton>
                            </RangeCalendar.Header>
                            {/*
                             * `weekdayStyle="narrow"` — « L M M J V S D » — et non le
                             * « short » par defaut de HeroUI, qui donne « lun. mar. ».
                             *
                             * La grille est en `repeat(7, 1fr)`, et `1fr` ne descend jamais
                             * sous la largeur du CONTENU. Avec « lun. » les sept colonnes
                             * reclamaient 393 px dans un popover de 276 : samedi et dimanche
                             * etaient coupes, et les dates sautaient de 4 a 7. Mesure a
                             * l'ecran — les sept colonnes etaient bien rendues, elles
                             * debordaient simplement de leur conteneur.
                             */}
                            <RangeCalendar.Grid weekdayStyle="narrow">
                                <RangeCalendar.GridHeader>
                                    {(jour) => <RangeCalendar.HeaderCell>{jour}</RangeCalendar.HeaderCell>}
                                </RangeCalendar.GridHeader>
                                <RangeCalendar.GridBody>
                                    {(date) => <RangeCalendar.Cell date={date} />}
                                </RangeCalendar.GridBody>
                            </RangeCalendar.Grid>
                        </RangeCalendar>
                    </DateRangePicker.Popover>
                </DateRangePicker>
            </div>
        </div>
    );
}
