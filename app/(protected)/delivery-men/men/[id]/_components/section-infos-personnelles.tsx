'use client';

import { Card } from '@heroui-v3/react';
import { AtSign, Home, Phone, Siren, User } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';

import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';

import { ChampDate, ChampTexte } from './champ-texte';
import { SectionTitle } from './section-title';

interface SectionInfosPersonnellesProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
}

/**
 * L'état civil du coursier.
 *
 * <p>Les icônes des champs étaient des ÉMOJIS — 📅 🏠 📞 ✉️ 🚨 — et la date de naissance
 * un `<input type="date">` brut. Ce sont des icônes du jeu du projet et le `DatePicker` de
 * la bibliothèque.</p>
 */
export function SectionInfosPersonnelles({ control, errors }: SectionInfosPersonnellesProps) {
  return (
    <Card>
      <Card.Content>
        <SectionTitle>Informations personnelles</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="nom"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.nom?.message}
                icone={User}
                label="Nom"
                onChange={field.onChange}
                placeholder="Douze"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="prenoms"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.prenoms?.message}
                icone={User}
                label="Prénom"
                onChange={field.onChange}
                placeholder="Ousmane"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="birthDay"
            render={({ field }) => (
              <ChampDate
                erreur={errors.birthDay?.message}
                label="Date de naissance"
                onChange={field.onChange}
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="habitation"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.habitation?.message}
                icone={Home}
                label="Domicile"
                onChange={field.onChange}
                placeholder="Koumassi Zone 4"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="telephone"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.telephone?.message}
                icone={Phone}
                label="Téléphone"
                onChange={field.onChange}
                placeholder="+225 0000000000"
                type="tel"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.email?.message}
                icone={AtSign}
                label="Adresse mail"
                onChange={field.onChange}
                placeholder="email@example.com"
                type="email"
                valeur={field.value ?? ''}
              />
            )}
          />
          {/* V48 (2026-05) — Numéro d'urgence (proche, famille) */}
          <Controller
            control={control}
            name="numeroPersonneAContacter"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.numeroPersonneAContacter?.message}
                icone={Siren}
                label="Personne à contacter (urgence)"
                onChange={field.onChange}
                placeholder="+225 0000000000"
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
