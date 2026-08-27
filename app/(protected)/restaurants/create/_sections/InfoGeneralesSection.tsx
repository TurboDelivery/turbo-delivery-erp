'use client';

import React, { useCallback, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Button, Input, Select, SelectItem, Textarea } from '@/components/heroui';
import { Input as AddressInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { Control, FieldErrors } from 'react-hook-form';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, placeDetails } from '@/lib/googlemaps-server';
import type { CreateRestaurantDTO } from '@/features/restaurants/schemas/create-restaurant.schema';

interface Contact {
  nom: string;
  telephone: string;
}

interface InfoGeneralesSectionProps {
  control: Control<CreateRestaurantDTO>;
  errors: FieldErrors<CreateRestaurantDTO>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

export function InfoGeneralesSection({ control, errors, contacts, setContacts }: InfoGeneralesSectionProps) {
  const { setValue } = useFormContext<CreateRestaurantDTO>();
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const handleLocalisationChange = useCallback(
    async (value: string) => {
      if (value.length > 2 && !loadingGeo) {
        try {
          setSuggestions(await autocomplete(value));
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    },
    [loadingGeo],
  );

  const handleSuggestionClick = async (suggestion: PlaceAutocompleteResult, onChange: (v: string) => void) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setLoadingGeo(true);
    try {
      const details = await placeDetails(suggestion.place_id);
      const lat = details.result.geometry?.location.lat ?? 0;
      const lng = details.result.geometry?.location.lng ?? 0;
      setValue('latitude', lat);
      setValue('longitude', lng);
    } catch {
      // fail silently
    } finally {
      setLoadingGeo(false);
    }
  };

  return (
    <section>
      <SectionTitle>Informations Générales</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller name="nomEtablissement" control={control} render={({ field }) => (
          <Input {...field} label="Nom de l'établissement" variant="bordered" isInvalid={!!errors.nomEtablissement} errorMessage={errors.nomEtablissement?.message} />
        )} />
        <Controller name="localisation" control={control} render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-localisation">Localisation</Label>
            <div className="relative">
              <AddressInput
                {...field}
                id="create-localisation"
                placeholder="Adresse complète"
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                onChange={(e) => {
                  field.onChange(e.target.value);
                  handleLocalisationChange(e.target.value);
                }}
              />
              {!loadingGeo && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li
                      key={s.place_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onMouseDown={() => handleSuggestionClick(s, field.onChange)}
                    >
                      {s.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
              label={`Nom et prénom contact ${i + 1}`}
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
