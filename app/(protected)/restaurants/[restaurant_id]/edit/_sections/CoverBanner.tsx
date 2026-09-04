'use client';

import React from 'react';
import { ImagePlus, Pencil } from 'lucide-react';

interface CoverBannerProps {
  coverPreview: string | null;
  logoPreview: string | null;
  existingLogoUrl: string | null;
  coverRef: React.RefObject<HTMLInputElement | null>;
  logoRef: React.RefObject<HTMLInputElement | null>;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CoverBanner({
  coverPreview,
  logoPreview,
  existingLogoUrl,
  coverRef,
  logoRef,
  onCoverChange,
  onLogoChange,
}: CoverBannerProps) {
  return (
    <div className="relative">
      {/* Cover */}
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
          {logoPreview ? (
            <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
          ) : existingLogoUrl ? (
            <img src={existingLogoUrl} alt="logo" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => logoRef.current?.click()}
          className="mt-1 w-full text-[11px] text-muted hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <Pencil className="w-3 h-3" /> Modifier
        </button>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
      </div>
    </div>
  );
}
