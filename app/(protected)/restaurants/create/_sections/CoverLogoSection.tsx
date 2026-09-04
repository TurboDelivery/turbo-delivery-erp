'use client';

import { ImagePlus } from 'lucide-react';

interface CoverLogoSectionProps {
  logoRef: React.RefObject<HTMLInputElement | null>;
  coverRef: React.RefObject<HTMLInputElement | null>;
  logoPreview: string | null;
  coverPreview: string | null;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CoverLogoSection({
  logoRef,
  coverRef,
  logoPreview,
  coverPreview,
  onLogoChange,
  onCoverChange,
}: CoverLogoSectionProps) {
  return (
    <div className="relative">
      {/* Cover banner */}
      <div
        className="relative h-40 w-full rounded-xl bg-surface-secondary border border-separator flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={() => coverRef.current?.click()}
      >
        {coverPreview ? (
          <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-muted">Aucune image</span>
        )}
        <button
          type="button"
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-surface border border-separator rounded-lg px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:border-primary hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); coverRef.current?.click(); }}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Modifier la couverture
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
      </div>

      {/* Logo */}
      <div className="absolute left-4 -bottom-10">
        <div
          className="w-16 h-16 rounded-xl border-2 border-white bg-surface-tertiary overflow-hidden cursor-pointer shadow-sm"
          onClick={() => logoRef.current?.click()}
        >
          {logoPreview && <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />}
        </div>
        <button
          type="button"
          onClick={() => logoRef.current?.click()}
          className="mt-1 w-full text-[11px] text-muted hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          Modifier
        </button>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
      </div>
    </div>
  );
}
