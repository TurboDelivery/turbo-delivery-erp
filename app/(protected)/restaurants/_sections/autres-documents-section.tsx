'use client';

import { Settings, Upload } from 'lucide-react';
import React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';

const AUTRES_DOCUMENTS_OPTIONS = [
  { label: 'Avenant au contrat', value: 'contrat' },
  { label: 'RIB bancaire', value: 'rib' },
  { label: 'Attestation fiscale', value: 'attestation' },
  { label: 'Autre document', value: 'autre' },
] as const;

/**
 * Le dépôt d'un document annexe du partenaire.
 *
 * <p>Ce composant existait en DEUX exemplaires, sous `create/` et sous `edit/`, qui ne
 * différaient que par le NOM de leurs props (`onTypeChange` / `setAutreDocType`). Les deux
 * formulaires montent le même.</p>
 *
 * <p>Le bouton d'import portait un caractère « ⬆ » comme icône, et sa bordure passait au
 * rouge de marque au survol — une simple zone de dépôt n'appelle pas la couleur de
 * l'entreprise.</p>
 */
interface AutresDocumentsSectionProps {
  autreDocFile: File | null;
  autreDocRef: React.RefObject<HTMLInputElement | null>;
  autreDocType: string;
  onFileChange: (file: File | null) => void;
  onTypeChange: (value: string) => void;
}

export function AutresDocumentsSection({
  autreDocFile,
  autreDocRef,
  autreDocType,
  onFileChange,
  onTypeChange,
}: AutresDocumentsSectionProps) {
  return (
    <section>
      <div className="mb-1 flex items-center gap-2">
        <Settings aria-hidden="true" className="size-4 text-muted" />
        <p className="text-sm font-semibold text-foreground">Autres documents</p>
      </div>
      <p className="mb-3 text-xs text-muted">
        Sélectionnez un document fourni par l&apos;entreprise
      </p>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <ChampListe
            label="Type de document"
            onChange={(v) => onTypeChange(v || 'contrat')}
            options={AUTRES_DOCUMENTS_OPTIONS}
            placeholder="Choisir un type"
            valeur={autreDocType}
          />
        </div>
        <label className="flex max-w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-separator px-3 py-2 text-sm text-muted transition-colors hover:border-foreground hover:text-foreground">
          <Upload aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">
            {autreDocFile ? autreDocFile.name : 'Importer un fichier .pdf, .png ou .jpg'}
          </span>
          <input
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            ref={autreDocRef}
            type="file"
          />
        </label>
      </div>
    </section>
  );
}
