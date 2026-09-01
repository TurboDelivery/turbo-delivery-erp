'use client';

import { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input, Select, SelectItem } from '@/components/heroui';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';
import { TYPE_VEHICULE_OPTIONS } from '@/features/turboys/schemas/create-turboy.schema';
import { SectionTitle } from './section-title';
import { UploadZone } from './upload-zone';

interface SectionVehiculeProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  vehicleFile: File | null;
  onVehicleChange: (file: File) => void;
}

export function SectionVehicule({
  control,
  errors,
  vehicleFile,
  onVehicleChange,
}: SectionVehiculeProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-xs p-6">
      <SectionTitle>Informations du véhicule</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <Controller
          name="typeVehicule"
          control={control}
          render={({ field }) => (
            <Select
              label="Type"
              placeholder="Sélectionner un type"
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) =>
                field.onChange(Array.from(keys as Set<string>)[0] ?? '')
              }
              isInvalid={!!errors.typeVehicule}
              errorMessage={errors.typeVehicule?.message}
              variant="bordered"
            >
              {TYPE_VEHICULE_OPTIONS.map((o) => (
                <SelectItem key={o.value}>{o.label}</SelectItem>
              ))}
            </Select>
          )}
        />
        <Controller
          name="nomVehicule"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Nom du véhicule"
              placeholder="KTML 31"
              isInvalid={!!errors.nomVehicule}
              errorMessage={errors.nomVehicule?.message}
              variant="bordered"
            />
          )}
        />
        <Controller
          name="immatriculation"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Immatriculation du véhicule"
              placeholder="CI0000000000"
              isInvalid={!!errors.immatriculation}
              errorMessage={errors.immatriculation?.message}
              variant="bordered"
              className="sm:col-span-2"
            />
          )}
        />
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2">Changer la photo du véhicule</p>
        <UploadZone
          label="Ajouter une photo"
          onChange={(files) => {
            if (files?.[0]) onVehicleChange(files[0]);
          }}
        />
        {vehicleFile && (
          <p className="text-xs text-green-600 mt-2">{vehicleFile.name}</p>
        )}
      </div>
    </section>
  );
}
