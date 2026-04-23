'use client';

import React from 'react';
import Select from 'react-select';
import { POSTES } from '@/features/personnel/constants/employee.constants';

interface PostesSelectFilterProps {
  selectedPostes: string[];
  onPostesChange: (postes: string[] | null) => void;
}

const postesOptions = POSTES.map((p) => ({ value: p, label: p }));

export function PostesSelectFilter({ selectedPostes, onPostesChange }: PostesSelectFilterProps) {
  return (
    <Select
      options={postesOptions}
      value={postesOptions.filter((opt) => selectedPostes?.includes(opt.value))}
      isClearable
      onChange={(opt) => onPostesChange(opt ? [opt.value] : null)}
      placeholder="Tous les postes"
      className="text-xs w-[220px]"
      classNamePrefix="react-select"
    />
  );
}
