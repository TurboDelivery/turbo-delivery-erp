'use client';

import { Card } from '@heroui-v3/react';
import { Phone } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';

import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';

import { ChampTexte } from './champ-texte';
import { SectionTitle } from './section-title';

interface SectionCompteProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
}

/** Le numéro qui porte le compte du livreur dans l'application. */
export function SectionCompte({ control, errors }: SectionCompteProps) {
  return (
    <Card>
      <Card.Content>
        <SectionTitle>Compte du livreur</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="telephoneCompte"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.telephoneCompte?.message}
                icone={Phone}
                label="Numéro de téléphone du compte"
                onChange={field.onChange}
                placeholder="0930000300"
                type="tel"
                valeur={field.value ?? ''}
              />
            )}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
