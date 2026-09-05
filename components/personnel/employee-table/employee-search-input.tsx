'use client';

import { InputGroup, TextField } from '@heroui-v3/react';
import { Search } from 'lucide-react';
import React from 'react';

interface EmployeeSearchInputProps {
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function EmployeeSearchInput({
  onChange,
  placeholder = 'Rechercher un employé...',
  value,
}: EmployeeSearchInputProps) {
  return (
    <TextField
      aria-label={placeholder}
      className="w-[250px] max-w-full"
      onChange={onChange}
      value={value}
    >
      {/*
       * `InputGroup.Prefix` et `InputGroup.Input`, et non l'`Input` autonome : ce dernier
       * porte SA propre bordure et sa propre largeur de contenu, ce qui donne un petit
       * champ borde flottant dans un grand cadre vide.
       */}
      <InputGroup>
        <InputGroup.Prefix>
          <Search aria-hidden="true" className="size-4" />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder={placeholder} />
      </InputGroup>
    </TextField>
  );
}
