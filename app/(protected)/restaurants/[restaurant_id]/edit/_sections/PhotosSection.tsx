'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface PhotosSectionProps {
  existingPictures: { id: string; url: string }[];
  picturePreviews: string[];
  pictureRef: React.RefObject<HTMLInputElement | null>;
  onPicturesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting: (id: string) => void;
  onRemoveNew: (index: number) => void;
}

export function PhotosSection({
  existingPictures,
  picturePreviews,
  pictureRef,
  onPicturesChange,
  onRemoveExisting,
  onRemoveNew,
}: PhotosSectionProps) {
  const total = existingPictures.length + picturePreviews.length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">Photos de l'établissement</p>
        <span className="text-xs text-gray-400">{total} / 8</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {existingPictures.map(({ id, url }) => (
          <div key={id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
            >✕</button>
          </div>
        ))}
        {picturePreviews.map((url, i) => (
          <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-primary/40 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveNew(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
            >✕</button>
          </div>
        ))}
        {total < 8 && (
          <button
            type="button"
            onClick={() => pictureRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors gap-1"
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
