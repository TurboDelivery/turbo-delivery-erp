'use client';
import React from 'react';
import {
  Button,
  Calendar,
  Card,
  ComboBox,
  DateField,
  DatePicker,
  Input,
  Label,
  ListBox,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { RestaurantSelect } from '../common/restaurant-select';

interface FactureFiltersProps {
  filters: {
    type: string;
    statut: string;
    periodeDebut: Date;
    periodeFin: Date;
    restaurantId?: string;
  };
  handleTypeFilterChange: (type?: string | null) => void;
  handleStatutFilterChange: (statut?: string | null) => void;
  handlePeriodeFilterChange: (debut?: Date, fin?: Date) => void;
  handleRestaurantFilterChange?: (restaurantId?: string | null) => void;
  onReset?: () => void;
  restaurants?: Array<{ label: string; value: string }>;
  restaurantsLoading?: boolean;
}

const statutOptions = [
  { key: 'PAID', label: 'Payée' },
  { key: 'DRAFT', label: 'Brouillon' },
  { key: 'PARTIAL', label: 'Partiellement payée' },
  { key: 'VALIDATED', label: 'Validée - non payée' },
];

export function FactureFilters({ filters, handleStatutFilterChange, handlePeriodeFilterChange, handleRestaurantFilterChange, onReset, restaurants, restaurantsLoading }: FactureFiltersProps) {
  /** Une date ISO vers le type calendaire de la bibliothèque. */
  const enDateCalendaire = (d: Date): CalendarDate | null =>
    Number.isNaN(d.getTime())
      ? null
      : new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

  /** Le champ de date de la bibliothèque, posé aux deux bornes. */
  const ChampDate = ({
    label,
    onDate,
    valeur,
  }: {
    label: string;
    onDate: (d: Date) => void;
    valeur: Date;
  }) => (
    <DatePicker
      onChange={(d: DateValue | null) => {
        if (d) onDate(new Date(d.toString()));
      }}
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

  return (
    <Card>
      <Card.Content className="gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Filtres</h3>
          {onReset && (
            <Button onPress={onReset} size="sm" variant="ghost">
              <X aria-hidden="true" className="size-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Restaurant</Label>
            <RestaurantSelect
              className="w-full"
              isLoading={restaurantsLoading}
              onChange={(value?: string) => handleRestaurantFilterChange?.(value)}
              options={restaurants || []}
              placeholder="Sélectionner un restaurant"
              value={filters.restaurantId}
            />
          </div>

          {/* Un ComboBox et non un Select : dans ce projet, toute liste se cherche. */}
          <ComboBox
            onSelectionChange={(c) => handleStatutFilterChange(c ? String(c) : null)}
            selectedKey={filters.statut || null}
          >
            <Label>Statut</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Sélectionner un statut" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={statutOptions}>
                {(o: { key: string; label: string }) => (
                  <ListBox.Item id={o.key} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          {/*
           * Les deux bornes etaient des `<input type="date">` bruts, avec une garde ecrite
           * a la main contre `new Date('')` — qui rend `Invalid Date`, un objet donc
           * TRUTHY : vider le champ pour resaisir une periode faisait partir une borne
           * invalide jusqu'au formatage, ou elle jetait une `RangeError`. Le `DatePicker`
           * de la bibliotheque ne rend jamais de date invalide ; la garde disparait avec
           * la cause.
           */}
          <ChampDate
            label="Période début"
            onDate={(d) => handlePeriodeFilterChange(d, filters.periodeFin)}
            valeur={filters.periodeDebut}
          />
          <ChampDate
            label="Période fin"
            onDate={(d) => handlePeriodeFilterChange(filters.periodeDebut, d)}
            valeur={filters.periodeFin}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
