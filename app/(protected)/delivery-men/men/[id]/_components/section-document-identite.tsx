'use client';

import { Card, Separator, Switch } from '@heroui-v3/react';
import { CreditCard } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';

import { TYPE_DOCUMENT_OPTIONS } from '@/features/turboys/schemas/create-turboy.schema';
import { type UpdateTurboyInfoDTO } from '@/features/turboys/schemas/update-turboy-info.schema';

import { ChampFichier, ChampListe, ChampTexte } from './champ-texte';
import { SectionTitle } from './section-title';
import { UploadZone } from './upload-zone';

interface SectionDocumentIdentiteProps {
  cniFiles: File[];
  control: Control<UpdateTurboyInfoDTO>;
  errors: FieldErrors<UpdateTurboyInfoDTO>;
  // V48 (2026-05) — Enrichissements ERP
  ficheIdentificationFile: File | null;
  onCniChange: (files: File[]) => void;
  onFicheIdentificationChange: (file: File | null) => void;
}

/** La pièce d'identité du coursier, ses photos et son permis. */
export function SectionDocumentIdentite({
  cniFiles,
  control,
  errors,
  ficheIdentificationFile,
  onCniChange,
  onFicheIdentificationChange,
}: SectionDocumentIdentiteProps) {
  return (
    <Card>
      <Card.Content className="gap-5">
        <SectionTitle>Document d&apos;identité</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="typeDocument"
            render={({ field }) => (
              <ChampListe
                erreur={errors.typeDocument?.message}
                label="Type de document"
                onChange={field.onChange}
                options={TYPE_DOCUMENT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                placeholder="Sélectionner un type"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="numeroCni"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.numeroCni?.message}
                icone={CreditCard}
                label="Numéro de la pièce"
                onChange={field.onChange}
                placeholder="CI0000000000"
                valeur={field.value ?? ''}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Changer les photos de la pièce (max 2)</p>
          <UploadZone
            label="Importer"
            multiple
            onChange={(files) => {
              if (files) onCniChange(Array.from(files).slice(0, 2));
            }}
          />
          {cniFiles.length > 0 && (
            <p className="text-xs text-success-soft-foreground">
              {cniFiles.length} fichier(s) sélectionné(s)
            </p>
          )}
        </div>

        <Separator />

        {/* V48 (2026-05) — Fiche d'identification (PDF/image) */}
        <ChampFichier
          fichier={ficheIdentificationFile}
          intitule="Importer la fiche d’identification (PDF, JPG, PNG)"
          onFichier={onFicheIdentificationChange}
          titre="Fiche d’identification"
        />

        <Separator />

        {/* V48 (2026-05) — Permis de conduire */}
        <Controller
          control={control}
          name="permisConduire"
          render={({ field }) => (
            <Switch isSelected={field.value ?? false} onChange={field.onChange}>
              <Switch.Content className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-foreground">Permis de conduire</span>
                <span className="text-xs text-muted">Le livreur détient-il un permis valide ?</span>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          )}
        />
      </Card.Content>
    </Card>
  );
}
