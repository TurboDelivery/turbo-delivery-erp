'use client';

import { useRef } from 'react';
import { Camera, FileText } from 'lucide-react';
import { SectionTitle } from './section-title';

interface SectionPhotoProfilProps {
  avatarPreview: string | null;
  prenom?: string | null;
  contratFile: File | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContratChange: (file: File) => void;
}

export function SectionPhotoProfil({
  avatarPreview,
  prenom,
  contratFile,
  onAvatarChange,
  onContratChange,
}: SectionPhotoProfilProps) {
  const avatarRef = useRef<HTMLInputElement>(null);

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Photo de profil</SectionTitle>
      <div className="flex items-center gap-5">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-primary/30"
            onClick={() => avatarRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-xl">
                {prenom?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow"
          >
            <Camera className="w-3 h-3" />
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Changer la photo</p>
          <p className="text-xs text-gray-400">JPG, PNG ou GIF (max: 2MB)</p>
        </div>
      </div>

      {/* Contrat */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-2">Contrat du livreur</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm">
            <FileText className="w-4 h-4 shrink-0" />
            <span>{contratFile ? contratFile.name : 'Importer le contrat (PDF, JPG, PNG)'}</span>
          </div>
          <input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onContratChange(e.target.files[0]);
            }}
          />
        </label>
        {contratFile && (
          <p className="text-xs text-green-600 mt-1.5">{contratFile.name} sélectionné</p>
        )}
      </div>
    </section>
  );
}
