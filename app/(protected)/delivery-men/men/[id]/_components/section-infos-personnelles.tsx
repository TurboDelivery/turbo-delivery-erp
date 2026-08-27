'use client';

import { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/heroui';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';
import { SectionTitle } from './section-title';

interface SectionInfosPersonnellesProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
}

export function SectionInfosPersonnelles({ control, errors }: SectionInfosPersonnellesProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Informations personnelles</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="nom"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Nom"
              placeholder="Douze"
              isInvalid={!!errors.nom}
              errorMessage={errors.nom?.message}
              variant="bordered"
            />
          )}
        />
        <Controller
          name="prenoms"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Prénom"
              placeholder="Ousmane"
              isInvalid={!!errors.prenoms}
              errorMessage={errors.prenoms?.message}
              variant="bordered"
            />
          )}
        />
        <Controller
          name="birthDay"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              label="Date de naissance"
              isInvalid={!!errors.birthDay}
              errorMessage={errors.birthDay?.message}
              variant="bordered"
              startContent={<span className="text-gray-400 text-sm">📅</span>}
            />
          )}
        />
        <Controller
          name="habitation"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Domicile"
              placeholder="Koumasi Zone 4"
              isInvalid={!!errors.habitation}
              errorMessage={errors.habitation?.message}
              variant="bordered"
              startContent={<span className="text-gray-400 text-sm">🏠</span>}
            />
          )}
        />
        <Controller
          name="telephone"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Téléphone"
              placeholder="+225 0000000000"
              isInvalid={!!errors.telephone}
              errorMessage={errors.telephone?.message}
              variant="bordered"
              startContent={<span className="text-gray-400 text-sm">📞</span>}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              label="Adresse mail"
              placeholder="email@example.com"
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
              variant="bordered"
              startContent={<span className="text-gray-400 text-sm">✉️</span>}
            />
          )}
        />
        {/* V48 (2026-05) — Numéro d'urgence (proche, famille) */}
        <Controller
          name="numeroPersonneAContacter"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Personne à contacter (urgence)"
              placeholder="+225 0000000000"
              isInvalid={!!errors.numeroPersonneAContacter}
              errorMessage={errors.numeroPersonneAContacter?.message}
              variant="bordered"
              startContent={<span className="text-gray-400 text-sm">🚨</span>}
            />
          )}
        />
      </div>
    </section>
  );
}
