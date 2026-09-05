'use client';

import {
  ComboBox,
  Description,
  FieldError,
  Input,
  InputGroup,
  Label,
  ListBox,
  NumberField,
  TextArea,
  TextField,
} from '@heroui-v3/react';
import React from 'react';

/**
 * Les champs des fenêtres du module Personnel.
 *
 * <h3>Ce qui change</h3>
 * <p>Chaque fenêtre — absence, avance sur salaire, prêt, régularisation, déclaration de
 * contrat — recomposait à la main la même triade : un `<Label>` de shadcn, un `Input` de
 * HeroUI v2 et un `<small className="text-red-500">` pour l'erreur. Trois bibliothèques
 * pour un champ, et une erreur peinte en `red-500` de la palette Tailwind, sans variante
 * sombre, à côté d'un champ dont l'état d'erreur venait, lui, du thème.</p>
 *
 * <p>Ici l'erreur est portée par le champ lui-même : `isInvalid` colore la bordure et
 * `FieldError` place le message, tous deux issus du thème et annoncés par les lecteurs
 * d'écran via `aria-describedby` — ce que le `<small>` ne faisait pas.</p>
 *
 * <p>Attention aux deux `onChange` de la v3, qui ne se ressemblent pas : `TextField`
 * passe la VALEUR, `TextArea` passe un ÉVÉNEMENT DOM.</p>
 */

export function ChampTexte({
  aide,
  erreur,
  label,
  onChange,
  placeholder,
  type = 'text',
  valeur,
}: {
  aide?: string;
  erreur?: string;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'date' | 'email' | 'tel' | 'text';
  valeur: string;
}) {
  return (
    <TextField isInvalid={Boolean(erreur)} onChange={onChange} value={valeur ?? ''}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input placeholder={placeholder} type={type} />
      </InputGroup>
      {aide && !erreur && <Description>{aide}</Description>}
      {erreur && <FieldError>{erreur}</FieldError>}
    </TextField>
  );
}

export function ChampMontant({
  aide,
  erreur,
  label,
  onChange,
  valeur,
}: {
  aide?: string;
  erreur?: string;
  label: string;
  onChange: (v: number) => void;
  valeur: number | undefined;
}) {
  return (
    <NumberField
      formatOptions={{ maximumFractionDigits: 0 }}
      isInvalid={Boolean(erreur)}
      minValue={0}
      onChange={onChange}
      value={valeur ?? Number.NaN}
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {aide && !erreur && <Description>{aide}</Description>}
      {erreur && <FieldError>{erreur}</FieldError>}
    </NumberField>
  );
}

export function ChampZoneTexte({
  erreur,
  label,
  lignes = 3,
  onChange,
  placeholder,
  valeur,
}: {
  erreur?: string;
  label: string;
  lignes?: number;
  onChange: (v: string) => void;
  placeholder?: string;
  valeur: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {/*
       * `TextArea` n'est PAS compose : il ne prend pas de `label`, et son `onChange`
       * recoit un EVENEMENT DOM la ou `TextField` passe la valeur. Un `onValueChange`
       * herite de la v2 serait ignore en silence et le champ ne remonterait rien.
       */}
      <TextArea
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={lignes}
        value={valeur ?? ''}
      />
      {erreur && <span className="text-xs text-danger">{erreur}</span>}
    </div>
  );
}

export function ChampListe({
  erreur,
  label,
  onChange,
  options,
  placeholder,
  valeur,
}: {
  erreur?: string;
  label: string;
  onChange: (v: string) => void;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
  valeur: string;
}) {
  return (
    <ComboBox
      isInvalid={Boolean(erreur)}
      onSelectionChange={(k) => onChange(k == null ? '' : String(k))}
      selectedKey={valeur || null}
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {erreur && <FieldError>{erreur}</FieldError>}
      <ComboBox.Popover>
        <ListBox items={options.map((o) => ({ id: o.value, label: o.label }))}>
          {(o: { id: string; label: string }) => (
            <ListBox.Item id={o.id} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

/** Un champ dont le contrôle est fourni par l'appelant (liste d'employés, par exemple). */
export function ChampEnveloppe({
  children,
  erreur,
  label,
}: {
  children: React.ReactNode;
  erreur?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {erreur && <span className="text-xs text-danger">{erreur}</span>}
    </div>
  );
}
