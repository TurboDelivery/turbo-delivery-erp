'use client';

import React from 'react';
import { Input } from '@/components/heroui';
import { Search } from 'lucide-react';

interface EmployeeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function EmployeeSearchInput({ 
  value, 
  onChange, 
  placeholder = "Rechercher un employé..." 
}: EmployeeSearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      startContent={
        <Search className="h-4 w-4 text-muted" />
      }
      variant="bordered"
      size="sm"
      className="w-[250px]"
    />
  );
}
