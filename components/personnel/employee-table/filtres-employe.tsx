'use client';

import { ComboBox, Input, ListBox } from '@heroui-v3/react';
import React from 'react';

import { POSTES } from '@/features/personnel/constants/employee.constants';

/**
 * Les listes de filtrage de l'effectif.
 *
 * <p>C'étaient deux `react-select` : une SECONDE bibliothèque de composants montée pour
 * ces deux champs, avec sa propre apparence et son propre préfixe de classes, donc deux
 * champs qui ne s'accordaient ni au thème sombre ni aux autres contrôles de la barre.</p>
 *
 * <p>Les vingt-neuf postes se cherchent au clavier, ce que la liste déroulante simple ne
 * permettrait pas.</p>
 */

function ListeFiltre({
  className,
  onChange,
  options,
  placeholder,
  valeur,
}: {
  className?: string;
  onChange: (v: string | null) => void;
  options: readonly { label: string; value: string }[];
  placeholder: string;
  valeur: string | null;
}) {
  return (
    <ComboBox
      aria-label={placeholder}
      className={className}
      onSelectionChange={(k) => onChange(k == null ? null : String(k))}
      selectedKey={valeur}
    >
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
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

const STATUTS = [
  { label: 'Actif', value: 'Actif' },
  { label: 'Inactif', value: 'Inactif' },
  { label: 'Congé', value: 'Congé' },
] as const;

export function StatutsSelectFilter({
  onStatutsChange,
  selectedStatuts,
}: {
  onStatutsChange: (statuts: string[] | null) => void;
  selectedStatuts: string[];
}) {
  return (
    <ListeFiltre
      className="w-full sm:w-[170px]"
      onChange={(v) => onStatutsChange(v ? [v] : null)}
      options={STATUTS}
      placeholder="Tous les statuts"
      valeur={selectedStatuts?.[0] ?? null}
    />
  );
}

const POSTES_OPTIONS = POSTES.map((p) => ({ label: p, value: p }));

export function PostesSelectFilter({
  onPostesChange,
  selectedPostes,
}: {
  onPostesChange: (postes: string[] | null) => void;
  selectedPostes: string[];
}) {
  return (
    <ListeFiltre
      className="w-full sm:w-[240px]"
      onChange={(v) => onPostesChange(v ? [v] : null)}
      options={POSTES_OPTIONS}
      placeholder="Tous les postes"
      valeur={selectedPostes?.[0] ?? null}
    />
  );
}
