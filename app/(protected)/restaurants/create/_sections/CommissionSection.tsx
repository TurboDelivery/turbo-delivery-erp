'use client';

import Link from 'next/link';

import { Controller } from 'react-hook-form';
import { Input, Select, SelectItem } from '@/components/heroui';
import type { Control } from 'react-hook-form';
import {
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
        {/* RG-03 — LE CYCLE NE SE REGLE PLUS ICI.
          *
          * Le cahier DOSSOU tranche : « il n'existe qu'un seul endroit pour definir la
          * facon dont un partenaire est facture ». Ce champ etait ce second endroit, et
          * c'etait lui qui pilotait reellement la facturation : deux ecrans pouvaient
          * afficher deux cycles differents pour le meme partenaire, sans qu'aucun ne
          * signale la contradiction. On renvoie donc vers l'ecran unique. */}
        <div className="rounded-medium border border-default-200 bg-default-50 p-3">
          <p className="text-sm font-medium text-default-700">Cycle de facturation</p>
          <p className="mt-1 text-xs text-default-500">
            Le cycle et l&apos;objet de la facturation se definissent dans l&apos;ecran unique
            « Configuration cycle de facturation partenaire ».
          </p>
          <Link
            href="/finance/cycle-facturation"
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            Ouvrir la configuration des cycles
          </Link>
        </div>
      </div>
    </section>
  );
}
