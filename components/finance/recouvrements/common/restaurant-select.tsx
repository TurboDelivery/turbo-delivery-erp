'use client';

import React from 'react';
import Select from 'react-select';

interface RestaurantSelectProps {
  value?: string;
  onChange: (value?: string) => void;
  options: Array<{ label: string; value: string }>;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function RestaurantSelect({
  value,
  onChange,
  options,
  isLoading = false,
  placeholder = 'Sélectionner un restaurant',
  className = 'text-xs w-full max-w-md',
}: RestaurantSelectProps) {
  return (
    <Select
      options={options}
      value={options.find((o) => o.value === value) ?? null}
      onChange={(opt) => onChange(opt?.value)}
      placeholder={placeholder}
      isClearable
      isLoading={isLoading}
      isDisabled={isLoading}
      className={className}
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '36px',
          height: '36px',
          width: '100%',
        }),
        valueContainer: (base) => ({
          ...base,
          height: '36px',
          padding: '0 8px',
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: '36px',
        }),
      }}
    />
  );
}

