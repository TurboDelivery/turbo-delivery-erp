'use client';

import { Plus } from 'lucide-react';

interface PhotosSectionProps {
  pictureRef: React.RefObject<HTMLInputElement | null>;
  picturePreviews: string[];
  onPicturesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

export function PhotosSection({ pictureRef, picturePreviews, onPicturesChange, onRemove }: PhotosSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Photos de l'établissement</p>
        <span className="text-xs text-muted">{picturePreviews.length} / 8</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {picturePreviews.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-primary/40 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
            >✕</button>
          </div>
        ))}
        {picturePreviews.length < 8 && (
          <button
            type="button"
            onClick={() => pictureRef.current?.click()}
            className="aspect-square border-2 border-dashed border-separator rounded-lg flex flex-col items-center justify-center text-muted hover:border-primary hover:text-primary transition-colors gap-1"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px]">Ajouter</span>
          </button>
        )}
        <input ref={pictureRef} type="file" accept="image/*" multiple className="hidden" onChange={onPicturesChange} />
      </div>
    </section>
  );
}
