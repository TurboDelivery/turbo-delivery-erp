'use client';

import { Card } from '@heroui-v3/react';
import { Bike, Hash } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';

import { TYPE_VEHICULE_OPTIONS } from '@/features/turboys/schemas/create-turboy.schema';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';

import { ChampListe, ChampTexte } from './champ-texte';
import { SectionTitle } from './section-title';
import { UploadZone } from './upload-zone';

interface SectionVehiculeProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  onVehicleChange: (file: File) => void;
  vehicleFile: File | null;
}

/** Le véhicule du coursier. */
export function SectionVehicule({
  control,
  errors,
  onVehicleChange,
  vehicleFile,
}: SectionVehiculeProps) {
  return (
    <Card>
      <Card.Content className="gap-5">
        <SectionTitle>Informations du véhicule</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="typeVehicule"
            render={({ field }) => (
              <ChampListe
                erreur={errors.typeVehicule?.message}
                label="Type"
                onChange={field.onChange}
                options={TYPE_VEHICULE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                placeholder="Sélectionner un type"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="nomVehicule"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.nomVehicule?.message}
                icone={Bike}
                label="Nom du véhicule"
                onChange={field.onChange}
                placeholder="KTML 31"
                valeur={field.value ?? ''}
              />
            )}
          />
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="immatriculation"
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.immatriculation?.message}
                  icone={Hash}
                  label="Immatriculation du véhicule"
                  onChange={field.onChange}
                  placeholder="CI0000000000"
                  valeur={field.value ?? ''}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Changer la photo du véhicule</p>
          <UploadZone
            label="Photo"
            onChange={(files) => {
              if (files?.[0]) onVehicleChange(files[0]);
            }}
          />
          {vehicleFile && (
            <p className="text-xs text-success-soft-foreground">{vehicleFile.name}</p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
