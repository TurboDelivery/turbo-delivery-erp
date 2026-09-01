'use client';

import React from 'react';
import { Select, SelectItem } from '@/components/heroui';
import { Settings } from 'lucide-react';

const AUTRES_DOCUMENTS_OPTIONS = [
  { value: 'contrat', label: 'Avenant au contrat' },
  { value: 'rib', label: 'RIB bancaire' },
  { value: 'attestation', label: 'Attestation fiscale' },
  { value: 'autre', label: 'Autre document' },
];

interface AutresDocumentsSectionProps {
  autreDocType: string;
  setAutreDocType: (v: string) => void;
  autreDocFile: File | null;
  setAutreDocFile: (f: File | null) => void;
  autreDocRef: React.RefObject<HTMLInputElement | null>;
}

export function AutresDocumentsSection({
  autreDocType,
  setAutreDocType,
  autreDocFile,
  setAutreDocFile,
  autreDocRef,
}: AutresDocumentsSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-4 h-4 text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">Autres Documents</p>
      </div>
      <p className="text-xs text-gray-400 mb-3">Sélectionnez un document fourni par de l'entreprise</p>
      <div className="flex items-center gap-3">
        <Select
          className="flex-1"
          variant="bordered"
          size="sm"
          selectedKeys={[autreDocType]}
          onSelectionChange={(keys) => setAutreDocType(Array.from(keys as Set<string>)[0] ?? 'contrat')}
        >
          {AUTRES_DOCUMENTS_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
        </Select>
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition-colors shrink-0 whitespace-nowrap">
          ⬆ {autreDocFile ? autreDocFile.name : 'Importer fichier .pdf ou .png ou .jpg'}
          <input
            ref={autreDocRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => setAutreDocFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </section>
  );
}
