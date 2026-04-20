'use client';

import { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@heroui/react';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';
import { SectionTitle } from './section-title';

interface SectionCompteProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
}

export function SectionCompte({ control, errors }: SectionCompteProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Compte du livreur</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="telephoneCompte"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Numéro de téléphone du compte"
              placeholder="0930000300"
              isInvalid={!!errors.telephoneCompte}
              errorMessage={errors.telephoneCompte?.message}
              variant="bordered"
            />
          )}
        />
      </div>
    </section>
  );
}
