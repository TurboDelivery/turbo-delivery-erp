'use client';

import React from 'react';
import { FileText } from 'lucide-react';

function DocumentUpload({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-separator rounded-lg text-muted hover:border-primary hover:text-primary transition-colors text-sm cursor-pointer w-full">
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate">{file ? file.name : 'Importer (PDF, JPG, PNG)'}</span>
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {file && <p className="text-xs text-green-600 mt-1">{file.name} sélectionné</p>}
    </div>
  );
}

interface DocumentsPartenaireSectionProps {
  ficheFile: File | null;
  contratFile: File | null;
  avenantFile: File | null;
  onFicheChange: (f: File | null) => void;
  onContratChange: (f: File | null) => void;
  onAvenantChange: (f: File | null) => void;
}

export function DocumentsPartenaireSection({
  ficheFile,
  contratFile,
  avenantFile,
  onFicheChange,
  onContratChange,
  onAvenantChange,
}: DocumentsPartenaireSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-muted" />
        <p className="text-sm font-semibold text-foreground">Documents partenariat</p>
      </div>
      <p className="text-xs text-muted mb-3">Documents officiels liés au partenariat</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DocumentUpload
          label="Fiche de renseignement partner"
          file={ficheFile}
          onChange={onFicheChange}
        />
        <DocumentUpload
          label="Contrat partenariat"
          file={contratFile}
          onChange={onContratChange}
        />
        <DocumentUpload
          label="Avenant au contrat"
          file={avenantFile}
          onChange={onAvenantChange}
        />
      </div>
    </section>
  );
}
