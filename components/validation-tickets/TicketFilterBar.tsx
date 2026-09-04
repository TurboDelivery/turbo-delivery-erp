'use client';

import { ComboBox, Input, Label, ListBox, SearchField } from '@heroui-v3/react';
import React from 'react';

import DateFilterInput from '@/components/finance/date-filter-input';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import type { DateRange } from 'react-day-picker';

export type SelectOption = { value: string; label: string };

export interface TicketFilters {
  search: string;
  numero: string;
  livreurId: string;
  restaurantId: string;
  debut: string;
  fin: string;
}

export const DEFAULT_TICKET_FILTERS: TicketFilters = {
  search: '',
  numero: '',
  livreurId: '',
  restaurantId: '',
  debut: '',
  fin: '',
};

/** Filtre client-side sur reference (numero), livreurId, restaurantId */
export function applyTicketFilters<
  T extends { reference: string; livreurId: string; restaurantId: string },
>(items: T[], filters: TicketFilters): T[] {
  const s = filters.search.toLowerCase().trim();
  const n = filters.numero.toLowerCase().trim();
  if (!s && !n && !filters.livreurId && !filters.restaurantId) return items;
  return items.filter(
    (item) =>
      (!s || item.reference.toLowerCase().includes(s)) &&
      (!n || item.reference.toLowerCase().includes(n)) &&
      (!filters.livreurId || item.livreurId === filters.livreurId) &&
      (!filters.restaurantId || item.restaurantId === filters.restaurantId),
  );
}

interface Props {
  value: TicketFilters;
  onChange: (v: TicketFilters) => void;
  livreurOptions: SelectOption[];
}

/** Aucun livreur choisi : la liste montre tout. */
const TOUS_LIVREURS = '__tous_livreurs__';

/**
 * Une date vers sa journee calendaire, en heure LOCALE.
 *
 * <p>`toISOString()` bascule en temps universel. Sous un fuseau negatif, une borne
 * choisie en fin de journee partait comme la VEILLE : le cycle affiche excluait alors
 * la journee que l'operateur venait de designer, sans que rien ne le signale.</p>
 */
function enJourLocal(d: Date | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/**
 * La barre de filtres des tickets de validation.
 *
 * <h3>Ce qui n'allait pas</h3>
 * <ul>
 *   <li>La liste des livreurs venait de react-select, une bibliotheque de plus avec ses
 *       propres couleurs ecrites en dur : sous le theme sombre de l'en-tete, le menu
 *       deroulant restait blanc sur blanc.</li>
 *   <li>Les intitules etaient des `<label>` bruts sans lien avec leur champ. Cliquer
 *       « Livreur » ne donnait le focus a rien, et un lecteur d'ecran annoncait une
 *       liste sans nom.</li>
 *   <li>Les bornes de periode passaient par `toISOString()`, qui decale la journee des
 *       que le poste n'est pas a l'heure universelle.</li>
 * </ul>
 */
export default function TicketFilterBar({ value, onChange, livreurOptions }: Props) {
  const debutDate = value.debut ? new Date(value.debut) : undefined;
  const finDate = value.fin ? new Date(value.fin) : undefined;

  // « Tous les livreurs » est une ENTREE de la liste, pas une croix a trouver : revenir
  // a l'absence de filtre se lit au meme endroit que les autres choix.
  const livreurs = React.useMemo(
    () => [{ value: TOUS_LIVREURS, label: 'Tous les livreurs' }, ...livreurOptions],
    [livreurOptions],
  );

  const handleDateChange = (range: DateRange | undefined) => {
    onChange({
      ...value,
      debut: enJourLocal(range?.from),
      fin: enJourLocal(range?.to),
    });
  };

  /*
   * QUATRE COLONNES EGALES NE CONVIENNENT PAS ICI.
   *
   * <p>`grid-cols-4` compile en `repeat(4, minmax(0, 1fr))` : les quatre pistes sont
   * strictement egales. Or le selecteur de periode porte une largeur FIXE de 280 px
   * (`date-filter-input.tsx`), partagee avec les ecrans finance. Sur la fenetre reelle
   * des postes (1000 px), une piste faisait 229 px : le selecteur debordait la grille
   * d'une cinquantaine de pixels, et de plus de cent entre 768 et 1023 px.</p>
   *
   * <p>Deux colonnes jusqu'a `lg`, comme le faisait le `flex-wrap` d'origine ; au-dela,
   * la periode prend la largeur dont elle a besoin et les trois autres se partagent le
   * reste. `items-end` aligne les controles par le bas : l'intitule de la periode est
   * rendu A L'INTERIEUR de son champ par la v2, alors que les trois autres sont
   * au-dessus du leur.</p>
   */
  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <SearchField
        fullWidth
        onChange={(v) => onChange({ ...value, numero: v })}
        value={value.numero}
      >
        <Label>Code check</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Rechercher par code check…" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <ComboBox
        onSelectionChange={(c) =>
          onChange({ ...value, livreurId: c === TOUS_LIVREURS ? '' : String(c ?? '') })
        }
        selectedKey={value.livreurId || TOUS_LIVREURS}
      >
        <Label>Livreur</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Tous les livreurs" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox items={livreurs}>
            {(o: SelectOption) => (
              <ListBox.Item id={o.value} textValue={o.label}>
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {/*
       * RestaurantSelect est partage par huit ecrans et porte encore react-select : sa
       * conversion est un chantier a lui seul. Il garde donc son intitule au-dessus,
       * comme avant.
       */}
      <div className="flex flex-col gap-1">
        <Label>Restaurant</Label>
        <RestaurantSelect
          value={value.restaurantId || undefined}
          onChange={(v) => onChange({ ...value, restaurantId: v ?? '' })}
          placeholder="Tous les restaurants"
          className="text-xs w-full"
        />
      </div>

      <DateFilterInput
        filters={{ debut: debutDate, fin: finDate }}
        handleDateChange={handleDateChange}
      />
    </div>
  );
}
