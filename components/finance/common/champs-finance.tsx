'use client';

import {
  ComboBox,
  Description,
  Input,
  Label,
  ListBox,
  NumberField,
  TextField,
} from '@heroui-v3/react';
import React from 'react';

/**
 * Les champs partagés des écrans de configuration Finance.
 *
 * <p>Ils étaient répétés écran par écran sous la forme d'`Input` v2 avec `label`,
 * `size`, `description` et `onValueChange` — quatre props que la v3 ignore ou renomme.
 * Un nombre saisi dans un `<input type="number">` remontait par ailleurs en CHAÎNE, avec
 * un `Number(v) || 0` à chaque point d'appel : le `NumberField` rend un nombre.</p>
 */
export function ChampNombre({
  aide,
  label,
  max,
  min = 0,
  onChange,
  valeur,
}: {
  aide?: string;
  label: string;
  max?: number;
  min?: number;
  onChange: (v: number) => void;
  valeur: number;
}) {
  return (
    <NumberField
      maxValue={max}
      minValue={min}
      onChange={(v) => onChange(Number.isNaN(v) ? 0 : v)}
      value={valeur}
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {aide && <Description>{aide}</Description>}
    </NumberField>
  );
}

/** Un champ texte, avec son aide sous le champ. */
export function ChampTexte({
  aide,
  label,
  onChange,
  placeholder,
  valeur,
}: {
  aide?: string;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  valeur: string;
}) {
  return (
    <TextField onChange={onChange} value={valeur ?? ''}>
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
      {aide && <Description>{aide}</Description>}
    </TextField>
  );
}

/** Une liste de choix — cherchable, comme toutes les listes de ce projet. */
export function ChampListe({
  aide,
  label,
  onChange,
  options,
  placeholder,
  valeur,
}: {
  aide?: string;
  label: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  valeur: string;
}) {
  return (
    <ComboBox onSelectionChange={(c) => onChange(c ? String(c) : '')} selectedKey={valeur || null}>
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {aide && <Description>{aide}</Description>}
      <ComboBox.Popover>
        <ListBox items={options}>
          {(o: { label: string; value: string }) => (
            <ListBox.Item id={o.value} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
