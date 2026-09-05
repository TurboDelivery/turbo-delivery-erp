'use client';

import { Button } from '@heroui-v3/react';
import { Plus, Upload } from 'lucide-react';
import { useRef } from 'react';

interface UploadZoneProps {
  label: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  preview?: null | string;
}

/**
 * Une zone de dépôt de fichier.
 *
 * <p>Les deux zones cliquables étaient des `<button>` écrits à la main, avec leur propre
 * bordure et leur propre survol en `hover:border-primary`. Ce sont des `Button` de la
 * bibliothèque ; l'`<input type="file">` caché reste, c'est le seul moyen d'ouvrir le
 * sélecteur de fichiers du système.</p>
 */
export function UploadZone({ label, multiple, onChange, preview }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        className="size-16 flex-col gap-1 overflow-hidden border-dashed p-1"
        onPress={() => ref.current?.click()}
        variant="outline"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={label} className="size-full object-cover" src={preview} />
        ) : (
          <>
            <Upload aria-hidden="true" className="size-5" />
            <span className="line-clamp-2 w-full text-center text-[9px] leading-tight">{label}</span>
          </>
        )}
      </Button>

      <Button
        aria-label={`Ajouter — ${label}`}
        className="size-10 rounded-full border-dashed"
        isIconOnly
        onPress={() => ref.current?.click()}
        variant="outline"
      >
        <Plus aria-hidden="true" className="size-4" />
      </Button>

      <input
        accept="image/*"
        className="hidden"
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
        ref={ref}
        type="file"
      />
    </div>
  );
}
