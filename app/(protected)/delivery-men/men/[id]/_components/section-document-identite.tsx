'use client';

import { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input, Select, SelectItem } from '@heroui/react';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';
import { TYPE_DOCUMENT_OPTIONS } from '@/features/turboys/schemas/create-turboy.schema';
import { SectionTitle } from './section-title';
import { UploadZone } from './upload-zone';

interface SectionDocumentIdentiteProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  cniFiles: File[];
  onCniChange: (files: File[]) => void;
}

export function SectionDocumentIdentite({
  control,
  errors,
  cniFiles,
  onCniChange,
}: SectionDocumentIdentiteProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Document d'identité</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <Controller
          name="typeDocument"
          control={control}
          render={({ field }) => (
            <Select
              label="Type de document"
              placeholder="Sélectionner un type"
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) =>
                field.onChange(Array.from(keys as Set<string>)[0] ?? '')
              }
              isInvalid={!!errors.typeDocument}
              errorMessage={errors.typeDocument?.message}
              variant="bordered"
            >
              {TYPE_DOCUMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value}>{o.label}</SelectItem>
              ))}
            </Select>
          )}
        />
        <Controller
          name="numeroCni"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Numéro de la pièce"
              placeholder="CI0000000000"
              isInvalid={!!errors.numeroCni}
              errorMessage={errors.numeroCni?.message}
              variant="bordered"
            />
          )}
        />
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2">Changer les photos de la pièce (max 2)</p>
        <UploadZone
          label="Importer"
          multiple
          onChange={(files) => {
            if (files) onCniChange(Array.from(files).slice(0, 2));
          }}
        />
        {cniFiles.length > 0 && (
          <p className="text-xs text-green-600 mt-2">{cniFiles.length} fichier(s) sélectionné(s)</p>
        )}
      </div>
    </section>
  );
}
