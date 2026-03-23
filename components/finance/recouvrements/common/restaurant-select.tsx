'use client';

import React from 'react';
import Select from 'react-select';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants';

interface RestaurantSelectProps {
  value?: string;
  onChange: (value?: string) => void;
  options?: Array<{ label: string; value: string }>;
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function RestaurantSelect({
  value,
  onChange,
  isDisabled = false,
  placeholder = 'Sélectionner un restaurant',
  className = 'text-xs w-full max-w-md',
}: RestaurantSelectProps) {
  const { data: restaurants = [], isLoading } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  return (
    <Select
      options={restoOpts}
      value={restoOpts.find((o) => o.value === value) ?? null}
      onChange={(opt) => onChange(opt?.value)}
      placeholder={placeholder}
      isClearable
      isLoading={isLoading}
      isDisabled={isLoading || isDisabled}
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

