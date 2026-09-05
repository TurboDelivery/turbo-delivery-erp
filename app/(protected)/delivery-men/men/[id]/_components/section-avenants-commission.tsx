'use client';

import { Button, Card, Label, NumberField } from '@heroui-v3/react';
import { FileText, Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';

import type { UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';

import { DocPreview } from './doc-preview';
import { SectionTitle } from './section-title';

interface SectionAvenantsCommissionProps {
  avenantFiles: File[];
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  existingAvenants?: null | string[];
  onAvenantsChange: (files: File[]) => void;
}

/**
 * La commission et les avenants au contrat.
 *
 * <p>La commission était un `<input type="number">` : elle devient un `NumberField`, dont
 * les TROIS enfants — décrément, saisie, incrément — sont obligatoires, faute de quoi la
 * grille `40px 1fr 40px` du composant écrase le champ dans la première piste.</p>
 *
 * <p>Le retrait d'un fichier était une pastille `bg-red-500` — une teinte de la palette
 * Tailwind — qui n'apparaissait qu'AU SURVOL : au doigt, sur une tablette, elle était
 * introuvable. Elle est toujours là, et c'est un `Button`.</p>
 */
export function SectionAvenantsCommission({
  avenantFiles,
  control,
  errors,
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
    <Card>
      <Card.Content className="gap-6">
        <SectionTitle>Commission &amp; avenants</SectionTitle>

        <Controller
          control={control}
          name="commission"
          render={({ field }) => (
            <NumberField
              className="max-w-xs"
              isInvalid={Boolean(errors.commission)}
              minValue={0}
              onChange={(v) => field.onChange(Number.isNaN(v) ? undefined : v)}
              step={0.01}
              value={field.value ?? Number.NaN}
            >
              <Label>Commission (%)</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input placeholder="Ex : 15" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          )}
        />

        {existingAvenants && existingAvenants.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted">Avenants actuels</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {existingAvenants.map((url, i) => (
                <DocPreview key={url} label={`Avenant ${i + 1}`} url={url} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Ajouter des avenants</p>

          {avenantFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {avenantFiles.map((file, i) => {
                const isPdf = file.type === 'application/pdf';
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div className="relative" key={`${file.name}-${i}`}>
                    {isPdf ? (
                      <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-separator bg-surface-secondary text-muted">
                        <FileText aria-hidden="true" className="size-8" />
                        <span className="w-full truncate px-2 text-center text-[11px] font-medium">
                          {file.name}
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={file.name}
                        className="h-28 w-full rounded-lg border border-separator object-cover"
                        src={objectUrl}
                      />
                    )}
                    <p className="mt-1 truncate text-[11px] text-muted">{file.name}</p>
                    <Button
                      aria-label={`Retirer ${file.name}`}
                      className="absolute -right-1.5 -top-1.5 size-6 rounded-full"
                      isIconOnly
                      onPress={() => removeFile(i)}
                      size="sm"
                      variant="danger"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            className="w-fit border-dashed"
            onPress={() => fileRef.current?.click()}
            variant="outline"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un fichier
          </Button>
          <input
            accept=".pdf,image/*"
            className="hidden"
            multiple
            onChange={handleFileChange}
            ref={fileRef}
            type="file"
          />
          <p className="text-xs text-muted">PDF, JPG ou PNG — plusieurs fichiers acceptés</p>
        </div>
      </Card.Content>
    </Card>
  );
}
