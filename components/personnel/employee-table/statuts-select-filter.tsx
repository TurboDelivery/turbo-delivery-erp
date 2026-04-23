'use client';

import React from 'react';
import Select from 'react-select';

interface StatutsSelectFilterProps {
  selectedStatuts: string[];
  onStatutsChange: (statuts: string[] | null) => void;
}

const statutsOptions = [
  { value: 'Actif', label: 'Actif' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Congé', label: 'Congé' },
];

export function StatutsSelectFilter({ selectedStatuts, onStatutsChange }: StatutsSelectFilterProps) {
  return (
    <Select
      options={statutsOptions}
      value={statutsOptions.find((opt) => selectedStatuts?.includes(opt.value)) ?? null}
      isClearable
      onChange={(opt) => onStatutsChange(opt ? [opt.value] : null)}
      placeholder="Tous les statuts"
      className="text-xs w-[160px]"
      classNamePrefix="react-select"
    />
  );
}
