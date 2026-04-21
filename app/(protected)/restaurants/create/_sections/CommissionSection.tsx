'use client';

import { Controller } from 'react-hook-form';
import { Input, Select, SelectItem } from '@heroui/react';
import type { Control } from 'react-hook-form';
import {
  METHOD_RECOUVREMENT_OPTIONS,
  TYPE_COMMISSION_OPTIONS,
  type CreateRestaurantDTO,
} from '@/features/restaurants/schemas/create-restaurant.schema';

interface CommissionSectionProps {
  control: Control<CreateRestaurantDTO>;
  typeCommission: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

export function CommissionSection({ control, typeCommission }: CommissionSectionProps) {
  return (
    <section>
      <SectionTitle>Type de commission</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex gap-2 items-end">
          <Controller name="typeCommission" control={control} render={({ field }) => (
            <Select
              label="Choisissez le type de commission"
              placeholder="Choisissez le type de commission"
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? '')}
              variant="bordered"
              className="flex-1"
            >
              {TYPE_COMMISSION_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
            </Select>
          )} />
          {(typeCommission === 'POURCENTAGE' || typeCommission === 'FIXE') && (
            <Controller name="commission" control={control} render={({ field }) => (
              <Input
                {...field}
                value={field.value?.toString() ?? '0'}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                type="number" className="w-24 shrink-0" variant="bordered"
                min={0} max={typeCommission === 'POURCENTAGE' ? 100 : undefined}
              />
            )} />
          )}
        </div>
        <Controller name="methodRecouvrement" control={control} render={({ field }) => (
          <Select
            label="Choisissez la période de recouvrement"
            placeholder="Choisissez la période de recouvrement"
            selectedKeys={field.value ? [field.value] : []}
            onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? undefined)}
            variant="bordered"
          >
            {METHOD_RECOUVREMENT_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
          </Select>
        )} />
      </div>
    </section>
  );
}
