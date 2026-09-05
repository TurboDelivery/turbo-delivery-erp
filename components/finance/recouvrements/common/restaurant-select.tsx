'use client';

import { ComboBox, Input, ListBox } from '@heroui-v3/react';
import React from 'react';

import { toRestaurantOptions } from '@/features/restaurants';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';

interface RestaurantSelectProps {
  className?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  onChange: (value?: string) => void;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  value?: string;
}

/**
 * Le choix d'un restaurant.
 *
 * <p>C'était un `react-select` — une TROISIÈME bibliothèque de composants dans le même
 * projet, à côté de HeroUI et de shadcn — habillée par un objet `styles` en ligne qui
 * imposait `minHeight: 36px` et une hauteur de conteneur en dur. Elle n'a jamais suivi le
 * thème : ni la surface, ni la bordure, ni le mode sombre. C'est le `ComboBox` de la
 * bibliothèque, qui se cherche au clavier comme partout ailleurs dans ce projet.</p>
 */
export function RestaurantSelect({
  className,
  isDisabled = false,
  onChange,
  placeholder = 'Sélectionner un restaurant',
  value,
}: RestaurantSelectProps) {
  const { data: restaurants = [], isLoading } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  return (
    <ComboBox
      className={className ?? 'w-full max-w-md'}
      isDisabled={isLoading || isDisabled}
      onSelectionChange={(c) => onChange(c ? String(c) : undefined)}
      selectedKey={value ?? null}
    >
      <ComboBox.InputGroup>
        <Input placeholder={isLoading ? 'Chargement…' : placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox items={restoOpts}>
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
