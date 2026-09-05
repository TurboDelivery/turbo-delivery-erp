'use client';

import { Avatar, Button, Card, Separator } from '@heroui-v3/react';
import { Camera, FileText } from 'lucide-react';
import { useRef } from 'react';

import { SectionTitle } from './section-title';

interface SectionPhotoProfilProps {
  avatarPreview: null | string;
  contratFile: File | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContratChange: (file: File) => void;
  prenom?: null | string;
}

/**
 * La photo de profil et le contrat.
 *
 * <p>La pastille de l'appareil photo était un `<button>` peint en `bg-primary` avec du
 * `text-white` écrit en dur, l'avatar un `<div onClick>` — donc inatteignable au clavier
 * alors qu'il ouvre le sélecteur de fichiers — et la confirmation d'import s'affichait en
 * `text-green-600`, une teinte de la palette Tailwind indifférente au thème.</p>
 */
export function SectionPhotoProfil({
  avatarPreview,
  contratFile,
  onAvatarChange,
  onContratChange,
  prenom,
}: SectionPhotoProfilProps) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const contratRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <Card.Content className="gap-5">
        <SectionTitle>Photo de profil</SectionTitle>

        <div className="flex items-center gap-5">
          <div className="relative">
            <Button
              aria-label="Changer la photo de profil"
              className="size-16 overflow-hidden rounded-full p-0"
              isIconOnly
              onPress={() => avatarRef.current?.click()}
              variant="outline"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Photo de profil" className="size-full object-cover" src={avatarPreview} />
              ) : (
                <Avatar className="size-full">
                  <Avatar.Fallback>{prenom?.[0]?.toUpperCase() ?? '?'}</Avatar.Fallback>
                </Avatar>
              )}
            </Button>
            <span className="pointer-events-none absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
              <Camera aria-hidden="true" className="size-3" />
            </span>
            <input
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
              ref={avatarRef}
              type="file"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Changer la photo</p>
            <p className="text-xs text-muted">JPG, PNG ou GIF (max : 2 Mo)</p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Contrat du livreur</p>
          <Button
            className="max-w-full border-dashed sm:w-fit"
            onPress={() => contratRef.current?.click()}
            variant="outline"
          >
            <FileText aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">
              {contratFile ? contratFile.name : 'Importer le contrat (PDF, JPG, PNG)'}
            </span>
          </Button>
          <input
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onContratChange(e.target.files[0]);
            }}
            ref={contratRef}
            type="file"
          />
          {contratFile && (
            <p className="text-xs text-success-soft-foreground">{contratFile.name} sélectionné</p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
