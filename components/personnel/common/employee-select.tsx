'use client';

import { ComboBox, Input, ListBox } from '@heroui-v3/react';
import React, { useMemo } from 'react';

import { useEmployeeListQuery } from '@/features/personnel/queries';

interface EmployeeSelectProps {
  className?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  limit?: number;
  onChange: (value?: string) => void;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  value?: string;
}

/**
 * Le choix d'un employé, parmi cinq cents.
 *
 * <h3>Ce qui change</h3>
 * <p>C'était un `react-select` : une SECONDE bibliothèque de composants montée pour ce
 * seul champ, avec sa propre apparence, ses propres classes, et une hauteur de 36 px
 * écrite en dur dans un objet `styles` — donc un champ qui ne s'accordait ni au thème
 * sombre, ni aux autres champs de la même fenêtre.</p>
 *
 * <p>La `ComboBox` de la bibliothèque fait la même chose : on tape, la liste se filtre.
 * Sur cinq cents employés, c'est le seul contrôle praticable.</p>
 */
export function EmployeeSelect({
  className = 'w-full max-w-md',
  isDisabled = false,
  isLoading = false,
  limit = 500,
  onChange,
  options,
  placeholder = 'Sélectionner un employé',
  value,
}: EmployeeSelectProps) {
  const { data, isLoading: queryLoading } = useEmployeeListQuery({
    limit,
    page: 0,
  });

  const employeeOptions = useMemo(() => {
    const employees = data?.content ?? [];
    return [...employees]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((employee) => ({ label: employee.name, value: employee.id }));
  }, [data?.content]);

  const selectOptions = options && options.length > 0 ? options : employeeOptions;
  const loading = isLoading || queryLoading;

  return (
    <ComboBox
      aria-label={placeholder}
      className={className}
      isDisabled={loading || isDisabled}
      onSelectionChange={(k) => onChange(k == null ? undefined : String(k))}
      selectedKey={value || null}
    >
      <ComboBox.InputGroup>
        <Input placeholder={loading ? 'Chargement…' : placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox items={selectOptions.map((o) => ({ id: o.value, label: o.label }))}>
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
