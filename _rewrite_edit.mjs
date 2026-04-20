import { writeFileSync } from 'fs';

const dest = 'd:/projet/turbo-delivery-erp/app/(protected)/restaurants/[restaurant_id]/edit/edit-content.tsx';

const content = `'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@heroui/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import {
  updateRestaurantSchema,
  type UpdateRestaurantDTO,
} from '@/features/restaurants/schemas/update-restaurant.schema';
import { updateRestaurant } from '@/features/restaurants/actions/update-restaurant.action';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { createUrlFile } from '@/utils/createUrlFile';
import { CoverBanner } from './_sections/CoverBanner';
import { InfoGenerales } from './_sections/InfoGenerales';
import { CommissionSection } from './_sections/CommissionSection';
import { PhotosSection } from './_sections/PhotosSection';
import { HorairesSection } from './_sections/HorairesSection';
import { AutresDocumentsSection } from './_sections/AutresDocumentsSection';

export default function EditContent({ restaurant }: { restaurant: IRestaurant }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);
  const autreDocRef = useRef<HTMLInputElement>(null);

  // File state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [picturePreviews, setPicturePreviews] = useState<string[]>([]);
  const [existingPictureIds, setExistingPictureIds] = useState<string[]>(
    () => restaurant.pictures?.map((p) => p.id) ?? []
  );

  // Contact & document state
  const [contacts, setContacts] = useState<{ nom: string; telephone: string }[]>([{ nom: '', telephone: '' }]);
  const [autreDocType, setAutreDocType] = useState('contrat');
  const [autreDocFile, setAutreDocFile] = useState<File | null>(null);

  // Derived values
  const existingLogoUrl = restaurant.logo_Url ? createUrlFile(restaurant.logo_Url, 'restaurant') : null;
  const existingPictures = restaurant.pictures
    ?.filter((p) => existingPictureIds.includes(p.id))
    .map((p) => ({ id: p.id, url: createUrlFile(p.pictureUrl, 'restaurant') })) ?? [];

  // Form
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<UpdateRestaurantDTO>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      nomEtablissement: '', description: '', email: '', telephone: '',
      codePostal: '', commune: '', localisation: '', siteWeb: '',
      typeCommission: '', commission: 0, methodRecouvrement: undefined,
    },
  });

  useEffect(() => {
    if (restaurant) {
      reset({
        nomEtablissement: restaurant.nomEtablissement ?? '',
        description: restaurant.description ?? '',
        email: restaurant.email ?? '',
        telephone: restaurant.telephone ?? '',
        codePostal: restaurant.codePostal ?? '',
        commune: restaurant.commune ?? '',
        localisation: restaurant.localisation ?? '',
        siteWeb: restaurant.siteWeb ?? '',
        typeCommission: restaurant.typeCommission ?? '',
        commission: restaurant.commission ?? 0,
        methodRecouvrement: restaurant.methodRecouvrement ?? undefined,
      });
    }
  }, [restaurant, reset]);

  const typeCommission = watch('typeCommission');

  // Handlers
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  }
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  }
  function handlePicturesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const combined = [...pictureFiles, ...Array.from(e.target.files)].slice(0, 8);
    setPictureFiles(combined);
    setPicturePreviews(combined.map((f) => URL.createObjectURL(f)));
  }
  function removeExistingPicture(id: string) {
    setExistingPictureIds((prev) => prev.filter((p) => p !== id));
  }
  function removeNewPicture(index: number) {
    const next = pictureFiles.filter((_, i) => i !== index);
    setPictureFiles(next);
    setPicturePreviews(next.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(values: UpdateRestaurantDTO) {
    setIsSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') fd.append(key, String(val));
    });
    if (logoFile) fd.append('logo', logoFile);
    if (coverFile) fd.append('coverImage', coverFile);
    pictureFiles.forEach((f) => fd.append('pictures', f));
    existingPictureIds.forEach((id) => fd.append('existingPictureIds', id));
    if (autreDocFile) { fd.append('document', autreDocFile); fd.append('documentType', autreDocType); }
    const result = await updateRestaurant(restaurant.id, fd);
    setIsSubmitting(false);
    if (result.status === 'success') {
      toast.success(result.message);
      router.push('/restaurants');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/restaurants" className="text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xl font-bold text-primary capitalize">{restaurant.nomEtablissement}</span>
        </div>
        <Button type="button" variant="bordered" size="sm" startContent={<Pencil className="w-3.5 h-3.5" />} onPress={() => logoRef.current?.click()}>
          Modifier
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

        <CoverBanner
          coverPreview={coverPreview}
          logoPreview={logoPreview}
          existingLogoUrl={existingLogoUrl}
          coverRef={coverRef}
          logoRef={logoRef}
          onCoverChange={handleCoverChange}
          onLogoChange={handleLogoChange}
        />
        <div className="mt-10" />

        <InfoGenerales
          control={control}
          errors={errors}
          contacts={contacts}
          setContacts={setContacts}
        />

        <CommissionSection
          control={control}
          typeCommission={typeCommission}
        />

        <PhotosSection
          existingPictures={existingPictures}
          picturePreviews={picturePreviews}
          pictureRef={pictureRef}
          onPicturesChange={handlePicturesChange}
          onRemoveExisting={removeExistingPicture}
          onRemoveNew={removeNewPicture}
        />

        <HorairesSection openingHours={restaurant.openingHours ?? []} />

        <AutresDocumentsSection
          autreDocType={autreDocType}
          setAutreDocType={setAutreDocType}
          autreDocFile={autreDocFile}
          setAutreDocFile={setAutreDocFile}
          autreDocRef={autreDocRef}
        />

        {/* Footer fixe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 z-10">
          <Button type="button" variant="flat" as={Link} href="/restaurants">Annuler</Button>
          <Button type="submit" color="primary" isLoading={isSubmitting}>Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
`;

writeFileSync(dest, content, 'utf8');
console.log('OK -', content.split('\n').length, 'lines');
