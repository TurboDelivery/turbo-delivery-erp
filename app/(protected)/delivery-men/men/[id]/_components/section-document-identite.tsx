'use client';

import { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input, Select, SelectItem, Switch } from '@/components/heroui';
import { FileText } from 'lucide-react';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';
import { TYPE_DOCUMENT_OPTIONS } from '@/features/turboys/schemas/create-turboy.schema';
import { SectionTitle } from './section-title';
import { UploadZone } from './upload-zone';

interface SectionDocumentIdentiteProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  cniFiles: File[];
  onCniChange: (files: File[]) => void;
  // V48 (2026-05) — Enrichissements ERP
  ficheIdentificationFile: File | null;
  onFicheIdentificationChange: (file: File | null) => void;
}

export function SectionDocumentIdentite({
  control,
  errors,
  cniFiles,
  onCniChange,
  ficheIdentificationFile,
  onFicheIdentificationChange,
}: SectionDocumentIdentiteProps) {
  return (
    <section className="bg-surface rounded-xl border border-separator shadow-xs p-6">
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
        <p className="text-sm text-muted mb-2">Changer les photos de la pièce (max 2)</p>
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

      {/* V48 (2026-05) — Fiche d'identification (PDF/image) */}
      <div className="mt-5 pt-5 border-t border-separator">
        <p className="text-sm font-medium text-foreground mb-2">Fiche d&apos;identification</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-separator rounded-lg text-muted hover:border-primary hover:text-primary transition-colors text-sm">
            <FileText className="w-4 h-4 shrink-0" />
            <span>
              {ficheIdentificationFile
                ? ficheIdentificationFile.name
                : 'Importer la fiche d\'identification (PDF, JPG, PNG)'}
            </span>
          </div>
          <input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onFicheIdentificationChange(e.target.files[0]);
            }}
          />
        </label>
        {ficheIdentificationFile && (
          <p className="text-xs text-green-600 mt-1.5">{ficheIdentificationFile.name} sélectionné</p>
        )}
      </div>

      {/* V48 (2026-05) — Permis de conduire */}
      <div className="mt-5 pt-5 border-t border-separator">
        <Controller
          name="permisConduire"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Permis de conduire</p>
                <p className="text-xs text-muted">Le livreur détient-il un permis valide ?</p>
              </div>
              <Switch
                isSelected={field.value ?? false}
                onValueChange={field.onChange}
              />
            </div>
          )}
        />
      </div>
    </section>
  );
}
