'use client';

import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { Plus } from 'lucide-react';
import { UpdateRestaurantDTO } from '@/features/restaurants/schemas/update-restaurant.schema';

interface InfoGeneralesProps {
  control: Control<UpdateRestaurantDTO>;
  errors: FieldErrors<UpdateRestaurantDTO>;
  contacts: { nom: string; telephone: string }[];
  setContacts: React.Dispatch<React.SetStateAction<{ nom: string; telephone: string }[]>>;
}

export function InfoGenerales({ control, errors, contacts, setContacts }: InfoGeneralesProps) {
  return (
    <section>
      <h2 className="text-base font-semibold text-primary mb-4">Informations Générales</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller name="nomEtablissement" control={control} render={({ field }) => (
          <Input {...field} label="Nom de l'établissement" variant="bordered" isInvalid={!!errors.nomEtablissement} errorMessage={errors.nomEtablissement?.message} />
        )} />
        <Controller name="localisation" control={control} render={({ field }) => (
          <Input {...field} label="Localisation" variant="bordered" />
        )} />
        <Controller name="telephone" control={control} render={({ field }) => (
          <Input {...field} label="Téléphone" variant="bordered" isInvalid={!!errors.telephone} errorMessage={errors.telephone?.message} />
        )} />
        <Controller name="commune" control={control} render={({ field }) => (
          <Input {...field} label="Commune" variant="bordered" />
        )} />
        <Controller name="codePostal" control={control} render={({ field }) => (
          <Input {...field} label="Code Postal" variant="bordered" />
        )} />
        <Select label="Type d'entreprise" defaultSelectedKeys={['restaurant']} variant="bordered">
          <SelectItem key="restaurant">Restaurant</SelectItem>
          <SelectItem key="cafe">Café</SelectItem>
          <SelectItem key="bar">Bar</SelectItem>
        </Select>
        <Controller name="email" control={control} render={({ field }) => (
          <Input {...field} type="email" label="Email" variant="bordered" isInvalid={!!errors.email} errorMessage={errors.email?.message} />
        )} />
        <Controller name="siteWeb" control={control} render={({ field }) => (
          <Input {...field} label="Site web (si disponible)" variant="bordered" />
        )} />
        <Controller name="description" control={control} render={({ field }) => (
          <Textarea {...field} label="Description" variant="bordered" className="sm:col-span-2" minRows={3} />
        )} />

        {contacts.map((c, i) => (
          <React.Fragment key={i}>
            <Input
              label={`Nom et prénom d'un contact ${i + 1}`}
              variant="bordered"
              value={c.nom}
              onChange={(e) => { const next = [...contacts]; next[i].nom = e.target.value; setContacts(next); }}
            />
            <Input
              label="Numéro de téléphone"
              variant="bordered"
              value={c.telephone}
              onChange={(e) => { const next = [...contacts]; next[i].telephone = e.target.value; setContacts(next); }}
            />
          </React.Fragment>
        ))}

        <div className="sm:col-span-2">
          <Button
            type="button" variant="bordered" size="sm"
            startContent={<Plus className="w-4 h-4" />}
            className="w-full border-dashed text-gray-500"
            onPress={() => setContacts([...contacts, { nom: '', telephone: '' }])}
          >
            Ajouter un autre contact
          </Button>
        </div>
      </div>
    </section>
  );
}
