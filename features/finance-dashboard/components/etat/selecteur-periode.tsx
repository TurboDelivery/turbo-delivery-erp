'use client';

import { DateRangePicker, RangeCalendar, Separator } from '@heroui-v3/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateValue } from 'react-aria-components/Calendar';

import { cn } from '@/lib/utils';

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
                {RACCOURCIS.map((r) => (
                    <button
                        aria-pressed={raccourci === r.cle}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            raccourci === r.cle
                                ? 'bg-accent text-white'
                                : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                        )}
                        key={r.cle}
                        onClick={() => onRaccourci(r.cle)}
                        type="button"
                    >
                        {r.libelle}
                    </button>
                ))}

                <Separator className="mx-0.5 h-5" orientation="vertical" />

                <DateRangePicker onChange={onPlage} value={plage}>
                    <DateRangePicker.Trigger
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            raccourci === 'libre'
                                ? 'bg-accent text-white'
                                : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                        )}
                    >
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {raccourci === 'libre' ? libelle : 'Période…'}
                    </DateRangePicker.Trigger>

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
                            <RangeCalendar.Grid>
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
