'use client';

import { useRef } from 'react';
import { Upload, Plus } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  preview?: string | null;
  onChange: (files: FileList | null) => void;
  multiple?: boolean;
}

export function UploadZone({ label, preview, onChange, multiple }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <>
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-[10px] text-center leading-tight">{label}</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />
    </div>
  );
}
