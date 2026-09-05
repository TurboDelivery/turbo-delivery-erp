'use client';

import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { Button, InputGroup, Label, TextField } from '@heroui-v3/react';
import { Plus } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import {
  type Control,
  Controller,
  type FieldErrors,
  type FieldValues,
  type Path,
  useFormContext,
} from 'react-hook-form';

import { TitreSection } from '@/components/commons/TitreSection';
import { ChampTexte, ChampZoneTexte } from '@/components/commons/champs-formulaire';
import { autocomplete, placeDetails } from '@/lib/googlemaps-server';

interface Contact {
  nom: string;
  telephone: string;
}

/**
 * Les informations générales d'un partenaire.
 *
 * <h3>Ce composant existait en deux exemplaires</h3>
 * <p>Un sous `create/`, un sous `edit/`, qui ne différaient que par le type du formulaire
 * porteur — et par leurs LIBELLÉS : la version d'édition avait perdu tous ses accents.
 * « Informations Generales », « Nom de l etablissement », « Telephone », « Adresse
 * complete », « Cafe », « Numero de telephone ». Le même formulaire se lisait correctement
 * à la création et estropié à la modification.</p>
 *
 * <h3>Un champ qui n'enregistrait rien</h3>
 * <p>La liste « Type d'entreprise » — Restaurant / Café / Bar — n'était reliée à AUCUN
 * champ du formulaire : ni `Controller`, ni `name`, ni `onChange`, et le schéma ne porte
 * pas de champ correspondant. L'opérateur choisissait « Café », voyait son choix affiché,
 * et rien n'était jamais envoyé. Un contrôle qui n'enregistre rien est pire que pas de
 * contrôle : il fait croire à une saisie faite. Il est retiré ; le jour où le back-end
 * portera ce champ, il reviendra branché.</p>
 */
interface InfoGeneralesSectionProps<T extends FieldValues> {
  contacts: Contact[];
  control: Control<T>;
  errors: FieldErrors<T>;
  /** Distingue les identifiants d'accessibilité quand les deux écrans coexistent. */
  prefixeId?: string;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export function InfoGeneralesSection<T extends FieldValues>({
  contacts,
  control,
  errors,
  prefixeId = 'partenaire',
  setContacts,
}: InfoGeneralesSectionProps<T>) {
  const { setValue } = useFormContext<T>();
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

  const handleSuggestionClick = async (
    suggestion: PlaceAutocompleteResult,
    onChange: (v: string) => void,
  ) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setLoadingGeo(true);
    try {
      const details = await placeDetails(suggestion.place_id);
      const lat = details.result.geometry?.location.lat ?? 0;
      const lng = details.result.geometry?.location.lng ?? 0;
      setValue('latitude' as Path<T>, lat as never);
      setValue('longitude' as Path<T>, lng as never);
    } catch {
      // fail silently
    } finally {
      setLoadingGeo(false);
    }
  };

  /** Un champ simple du formulaire, relié au contrôleur. */
  const champ = (nom: string, label: string, type?: 'email' | 'tel' | 'text') => (
    <Controller
      control={control}
      name={nom as Path<T>}
      render={({ field }) => (
        <ChampTexte
          erreur={(errors as Record<string, { message?: string }>)[nom]?.message}
          label={label}
          onChange={field.onChange}
          type={type}
          valeur={(field.value as string) ?? ''}
        />
      )}
    />
  );

  return (
    <section>
      <TitreSection>Informations générales</TitreSection>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {champ('nomEtablissement', "Nom de l'établissement")}

        <Controller
          control={control}
          name={'localisation' as Path<T>}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <TextField
                  isInvalid={fieldState.invalid}
                  onChange={(v) => {
                    field.onChange(v);
                    handleLocalisationChange(v);
                  }}
                  value={(field.value as string) ?? ''}
                >
                  <Label>Localisation</Label>
                  <InputGroup>
                    <InputGroup.Input
                      autoComplete="off"
                      id={`${prefixeId}-localisation`}
                      placeholder="Adresse complète"
                    />
                  </InputGroup>
                </TextField>
                {!loadingGeo && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-separator bg-surface shadow-lg">
                    {suggestions.map((s) => (
                      <li
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-surface-secondary"
                        key={s.place_id}
                        onMouseDown={() => handleSuggestionClick(s, field.onChange)}
                      >
                        {s.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        />

        {champ('telephone', 'Téléphone', 'tel')}
        {champ('commune', 'Commune')}
        {champ('codePostal', 'Code postal')}
        {champ('email', 'Email', 'email')}
        {champ('siteWeb', 'Site web (si disponible)')}

        <div className="sm:col-span-2">
          <Controller
            control={control}
            name={'description' as Path<T>}
            render={({ field }) => (
              <ChampZoneTexte
                label="Description"
                onChange={field.onChange}
                valeur={(field.value as string) ?? ''}
              />
            )}
          />
        </div>

        {contacts.map((c, i) => (
          <React.Fragment key={i}>
            <ChampTexte
              label={`Nom et prénom du contact ${i + 1}`}
              onChange={(v) => {
                const next = [...contacts];
                next[i].nom = v;
                setContacts(next);
              }}
              valeur={c.nom}
            />
            <ChampTexte
              label="Numéro de téléphone"
              onChange={(v) => {
                const next = [...contacts];
                next[i].telephone = v;
                setContacts(next);
              }}
              type="tel"
              valeur={c.telephone}
            />
          </React.Fragment>
        ))}

        <div className="sm:col-span-2">
          <Button
            className="w-full border-dashed"
            onPress={() => setContacts([...contacts, { nom: '', telephone: '' }])}
            size="sm"
            variant="outline"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un autre contact
          </Button>
        </div>
      </div>
    </section>
  );
}
