'use client';

import {
    Button,
    ComboBox,
    DateField,
    DateRangePicker,
    Input,
    Label,
    ListBox,
    RangeCalendar,
    SearchField,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import React from 'react';

import { ITicketParams } from '@/features/tickets/types/tickets.type';

/**
 * Les filtres de l'archive des tickets.
 *
 * <h3>Ce qui n'allait pas</h3>
 * <ul>
 *   <li>Deux champs de date SEPARES, chacun un `<input type="date">` brut. Ils cachaient
 *       la seule chose qui compte — la PERIODE — et rien n'empechait de choisir une fin
 *       anterieure au debut, ce qui rendait une archive vide sans expliquer pourquoi.</li>
 *   <li>Les deux listes venaient de react-select, une bibliotheque de plus, avec ses
 *       propres couleurs qui ignorent le theme sombre.</li>
 *   <li>Aucun moyen de remettre les filtres a zero : on effacait a la main, champ par
 *       champ, et on ne savait pas toujours lequel restreignait encore la liste.</li>
 * </ul>
 *
 * <h3>Ce qui change</h3>
 * <p>Une plage unique, saisissable au clavier segment par segment ou au calendrier ; deux
 * listes filtrables — indispensable avec 222 livreurs ; et un retour a zero qui n'apparait
 * que lorsqu'un filtre est effectivement pose.</p>
 */

interface Option {
    value: string;
    label: string;
}

interface TicketTableFiltersProps {
    search: string;
    livreurId: string;
    restaurantId: string;
    debut: Date;
    fin: Date;
    livreurOptions: Option[];
    restaurantOptions: Option[];
    onFilterChange: <K extends keyof ITicketParams>(key: K, value: string | Date | number) => void;
    onReset?: () => void;
}

/**
 * Une date JavaScript vers une date calendaire, en heure LOCALE.
 *
 * <p>`toISOString()` bascule en temps universel : passe minuit et sous un fuseau negatif,
 * il rend la veille. Le code precedent l'utilisait pour remplir les deux champs.</p>
 */
function enCalendaire(d: Date): CalendarDate | null {
    if (!d || Number.isNaN(d.getTime())) return null;
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Aucun filtre pose : la liste montre tout. */
const TOUS = '__tous__';

export function TicketTableFilters({
    search,
    livreurId,
    restaurantId,
    debut,
    fin,
    livreurOptions,
    restaurantOptions,
    onFilterChange,
    onReset,
}: TicketTableFiltersProps) {
    // « Tous » est une ENTREE de la liste, pas une croix a trouver : le choix de ne pas
    // filtrer se lit au meme endroit que les autres choix.
    const livreurs = React.useMemo(
        () => [{ value: TOUS, label: 'Tous les livreurs' }, ...livreurOptions],
        [livreurOptions],
    );
    const restaurants = React.useMemo(
        () => [{ value: TOUS, label: 'Tous les partenaires' }, ...restaurantOptions],
        [restaurantOptions],
    );

    const plage = React.useMemo(() => {
        const s = enCalendaire(debut);
        const e = enCalendaire(fin);
        return s && e ? { start: s, end: e } : null;
    }, [debut, fin]);

    const filtreActif = Boolean(search || livreurId || restaurantId);

    return (
        <div className="mb-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <SearchField fullWidth onChange={(v) => onFilterChange('search', v)} value={search}>
                    <Label>Code check</Label>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Rechercher un code…" />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>

                <ComboBox
                    onSelectionChange={(c) => onFilterChange('livreurId', c === TOUS ? '' : String(c ?? ''))}
                    selectedKey={livreurId || TOUS}
                >
                    <Label>Livreur</Label>
                    <ComboBox.InputGroup>
                        <Input placeholder="Tous les livreurs" />
                        <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                        <ListBox items={livreurs}>
                            {(o: Option) => (
                                <ListBox.Item id={o.value} textValue={o.label}>
                                    {o.label}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            )}
                        </ListBox>
                    </ComboBox.Popover>
                </ComboBox>

                <ComboBox
                    onSelectionChange={(c) => onFilterChange('restaurantId', c === TOUS ? '' : String(c ?? ''))}
                    selectedKey={restaurantId || TOUS}
                >
                    <Label>Partenaire</Label>
                    <ComboBox.InputGroup>
                        <Input placeholder="Tous les partenaires" />
                        <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                        <ListBox items={restaurants}>
                            {(o: Option) => (
                                <ListBox.Item id={o.value} textValue={o.label}>
                                    {o.label}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            )}
                        </ListBox>
                    </ComboBox.Popover>
                </ComboBox>

                {/*
                 * UNE periode, pas deux dates. Les deux champs separes laissaient poser une
                 * fin anterieure au debut : l'archive revenait vide sans dire pourquoi. Une
                 * plage ne peut pas etre a l'envers.
                 */}
                <DateRangePicker
                    onChange={(p: { start: DateValue; end: DateValue } | null) => {
                        if (!p) return;
                        onFilterChange('debut', p.start.toString());
                        onFilterChange('fin', p.end.toString());
                    }}
                    value={plage}
                >
                    <Label>Période</Label>
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
                            <RangeCalendar.Grid>
                                <RangeCalendar.GridHeader>
                                    {(jour: string) => <RangeCalendar.HeaderCell>{jour}</RangeCalendar.HeaderCell>}
                                </RangeCalendar.GridHeader>
                                <RangeCalendar.GridBody>
                                    {(date: CalendarDate) => <RangeCalendar.Cell date={date} />}
                                </RangeCalendar.GridBody>
                            </RangeCalendar.Grid>
                        </RangeCalendar>
                    </DateRangePicker.Popover>
                </DateRangePicker>
            </div>

            {/*
             * Le retour a zero n'apparait que lorsqu'il a un effet. Un bouton toujours
             * present mais souvent sans objet devient du decor qu'on cesse de voir.
             */}
            {filtreActif && onReset && (
                <div className="flex justify-end">
                    <Button onPress={onReset} size="sm" variant="ghost">
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Réinitialiser les filtres
                    </Button>
                </div>
            )}
        </div>
    );
}
