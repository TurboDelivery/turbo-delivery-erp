'use client';

import { useRef } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Input } from '@/components/heroui';
import { FileText, Plus, X } from 'lucide-react';
import { SectionTitle } from './section-title';
import { DocPreview } from './doc-preview';
import type { UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';

interface SectionAvenantsCommissionProps {
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  avenantFiles: File[];
  existingAvenants?: string[] | null;
  onAvenantsChange: (files: File[]) => void;
}

export function SectionAvenantsCommission({
  control,
  errors,
  avenantFiles,
  existingAvenants,
  onAvenantsChange,
}: SectionAvenantsCommissionProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    onAvenantsChange([...avenantFiles, ...Array.from(e.target.files)]);
    e.target.value = '';
  }

  function removeFile(index: number) {
    onAvenantsChange(avenantFiles.filter((_, i) => i !== index));
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Commission &amp; Avenants</SectionTitle>

      {/* Commission */}
      <div className="mb-6">
        <Controller
          name="commission"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Commission (%)"
              type="number"
              min={0}
              step={0.01}
              placeholder="Ex: 15"
              variant="bordered"
              className="max-w-xs"
              isInvalid={!!errors.commission}
              errorMessage={errors.commission?.message}
              value={field.value !== undefined ? String(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          )}
        />
      </div>

      {/* Avenants existants */}
      {existingAvenants && existingAvenants.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Avenants actuels</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingAvenants.map((url, i) => (
              <DocPreview key={i} label={`Avenant ${i + 1}`} url={url} />
            ))}
          </div>
        </div>
      )}

      {/* Upload nouveaux avenants */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Ajouter des avenants</p>
        {avenantFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {avenantFiles.map((file, i) => {
              const isPdf = file.type === 'application/pdf';
              const objectUrl = URL.createObjectURL(file);
              return (
                <div key={i} className="relative group">
                  {isPdf ? (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-primary/30 bg-primary/5 text-primary">
                      <FileText className="w-8 h-8" />
                      <span className="text-[11px] font-medium text-center px-2 truncate w-full">{file.name}</span>
                    </div>
                  ) : (
                    <img
                      src={objectUrl}
                      alt={file.name}
                      className="w-full h-28 object-cover rounded-lg border-2 border-primary/30"
                    />
                  )}
                  <p className="text-[11px] text-gray-400 mt-1 truncate">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un fichier
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-400 mt-2">PDF, JPG ou PNG — plusieurs fichiers acceptés</p>
      </div>
    </section>
  );
}
