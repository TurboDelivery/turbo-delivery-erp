'use client';

import {
  Button,
  Calendar,
  ComboBox,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Input,
  InputGroup,
  Label,
  ListBox,
  TextField,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import React, { useRef } from 'react';

/**
 * Les champs de la fiche coursier, montés une fois.
 *
 * <p>Chaque champ portait son icône sous forme d'ÉMOJI — 📅 🏠 📞 ✉️ 🚨 — rendus dans un
 * `startContent`. Un émoji n'est pas une icône : il change de dessin d'un système à
 * l'autre, il ne suit ni la couleur ni la taille du texte, et il est lu à voix haute par
 * les lecteurs d'écran (« calendrier », « maison »…) au milieu du libellé. Ce sont
 * désormais des icônes du jeu du projet, marquées `aria-hidden`.</p>
 */
export function ChampTexte({
  erreur,
  icone: Icone,
  label,
  onChange,
  placeholder,
  type,
  valeur,
}: {
  erreur?: string;
  icone?: React.ComponentType<{ className?: string }>;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'email' | 'tel' | 'text';
  valeur: string;
}) {
  return (
    <TextField isInvalid={Boolean(erreur)} onChange={onChange} value={valeur ?? ''}>
      <Label>{label}</Label>
      {/*
       * `InputGroup.Prefix` et `InputGroup.Input`, et non l'`Input` autonome : ce dernier
       * porte SA propre bordure et sa propre largeur de contenu, ce qui donnait un petit
       * champ borde flottant dans un grand cadre borde vide. Seul `InputGroup.Input`
       * s'etire dans le groupe.
       */}
      <InputGroup>
        {Icone && (
          <InputGroup.Prefix>
            <Icone aria-hidden="true" className="size-4" />
          </InputGroup.Prefix>
        )}
        <InputGroup.Input placeholder={placeholder} type={type} />
      </InputGroup>
      {erreur && <FieldError>{erreur}</FieldError>}
    </TextField>
  );
}

function enDateCalendaire(iso: string): CalendarDate | null {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  return a && m && j ? new CalendarDate(a, m, j) : null;
}

/** Une date, avec le calendrier de la bibliothèque et non un `<input type="date">`. */
export function ChampDate({
  aide,
  erreur,
  label,
  onChange,
  valeur,
}: {
  aide?: string;
  erreur?: string;
  label: string;
  onChange: (v: string) => void;
  valeur: string;
}) {
  return (
    <DatePicker
      isInvalid={Boolean(erreur)}
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
      {aide && !erreur && <Description>{aide}</Description>}
      {erreur && <FieldError>{erreur}</FieldError>}
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

/**
 * Une liste de choix.
 *
 * <p>Un `ComboBox` et non un `Select` : dans ce projet, tout ce qui est une liste se
 * cherche. Sur trois options le gain est mince, mais la cohérence évite d'avoir à se
 * demander, écran par écran, si celle-ci se tape ou se déroule.</p>
 */
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
  options: { label: string; value: string }[];
  placeholder?: string;
  valeur: string;
}) {
  return (
    <ComboBox
      isInvalid={Boolean(erreur)}
      onSelectionChange={(c) => onChange(c ? String(c) : '')}
      selectedKey={valeur || null}
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {erreur && <FieldError>{erreur}</FieldError>}
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

/**
 * L'import d'un document.
 *
 * <p>C'était un `<label>` enveloppant une boîte à bordure pointillée peinte à la main,
 * avec son propre survol `hover:border-primary`, et la confirmation s'affichait en
 * `text-green-600` — une teinte de la palette Tailwind, indifférente au thème.</p>
 */
export function ChampFichier({
  accept = '.pdf,image/*',
  intitule,
  onFichier,
  fichier,
  titre,
}: {
  accept?: string;
  fichier: File | null;
  intitule: string;
  onFichier: (f: File) => void;
  titre: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{titre}</p>
      {/* `max-w-full` et un libelle qui se coupe : « Importer la fiche d'identification
          (PDF, JPG, PNG) » faisait 381 px et debordait la page sur un telephone. */}
      <Button
        className="max-w-full border-dashed sm:w-fit"
        onPress={() => ref.current?.click()}
        variant="outline"
      >
        <FileText aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{fichier ? fichier.name : intitule}</span>
      </Button>
      <input
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onFichier(e.target.files[0]);
        }}
        ref={ref}
        type="file"
      />
      {fichier && <p className="text-xs text-success-soft-foreground">{fichier.name} sélectionné</p>}
    </div>
  );
}
