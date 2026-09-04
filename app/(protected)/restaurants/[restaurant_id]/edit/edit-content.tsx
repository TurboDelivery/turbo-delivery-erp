'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/heroui';
import { ArrowLeft, Pencil } from 'lucide-react';
import {
  updateRestaurantSchema,
  type UpdateRestaurantDTO,
} from '@/features/restaurants/schemas/update-restaurant.schema';
import { updateRestaurant } from '@/features/restaurants/actions/update-restaurant.action';
import { useInvalidateRestaurantsQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { createUrlFile } from '@/utils/createUrlFile';
import { geocodeAddressServer } from '@/lib/googlemaps-server';
import { CoverBanner } from './_sections/CoverBanner';
import { InfoGenerales } from './_sections/InfoGenerales';
import { CommissionSection } from './_sections/CommissionSection';
import { CommissionHistorySection } from './_sections/CommissionHistorySection';
import { CompteSection } from './_sections/CompteSection';
import { PhotosSection } from './_sections/PhotosSection';
import { HorairesSection, type Horaire } from './_sections/HorairesSection';
import { AutresDocumentsSection } from './_sections/AutresDocumentsSection';
import { compresserImage, compresserImages } from '@/lib/compresser-image';

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;

/**
 * Mesure volontairement plus etroite que le conteneur de page.
 *
 * C'est le seul endroit de l'ERP ou l'ecart est justifie : les champs de ce
 * formulaire sont en colonne unique, et une saisie de 1280px de large oblige
 * l'oeil a traverser tout l'ecran entre l'etiquette et la valeur. La contrainte
 * porte sur le FORMULAIRE, pas sur la page.
 */
export default function EditContent({ restaurant }: { restaurant: IRestaurant }) {
  const router = useRouter();
  const invalidateRestaurants = useInvalidateRestaurantsQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);
  const autreDocRef = useRef<HTMLInputElement>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [picturePreviews, setPicturePreviews] = useState<string[]>([]);
  const [existingPictureIds, setExistingPictureIds] = useState<string[]>(
    () => restaurant.pictures?.map((p) => p.id) ?? [],
  );

  const [contacts, setContacts] = useState<{ nom: string; telephone: string }[]>([
    { nom: '', telephone: '' },
  ]);

  const [autreDocType, setAutreDocType] = useState('contrat');
  const [autreDocFile, setAutreDocFile] = useState<File | null>(null);

  // Compte partenaire
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [horaires, setHoraires] = useState<Horaire[]>(() => {
    if (restaurant.openingHours?.length > 0) {
      return JOURS.map((jour) => {
        const existing = restaurant.openingHours.find((h) => h.dayOfWeek === jour);
        return existing
          ? { jour, ouverture: existing.openingTime?.slice(0, 5) ?? '08:00', fermeture: existing.closingTime?.slice(0, 5) ?? '22:00', ferme: existing.closed }
          : { jour, ouverture: '08:00', fermeture: '22:00', ferme: false };
      });
    }
    return JOURS.map((j) => ({ jour: j, ouverture: '08:00', fermeture: '22:00', ferme: false }));
  });

  const existingLogoUrl = restaurant.logo_Url ? createUrlFile(restaurant.logo_Url, 'restaurant') : null;
  const existingPictures =
    restaurant.pictures
      ?.filter((p) => existingPictureIds.includes(p.id))
      .map((p) => ({ id: p.id, url: createUrlFile(p.pictureUrl, 'restaurant') })) ?? [];

  const methods = useForm<UpdateRestaurantDTO>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      nomEtablissement: '', description: '', email: '', telephone: '',
      codePostal: '', commune: '', localisation: '', siteWeb: '',
      typeCommission: '', commission: 0, methodRecouvrement: undefined,
      latitude: undefined, longitude: undefined,
    },
  });

  const { control, handleSubmit, reset, watch, formState: { errors } } = methods;

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
        latitude: restaurant.latitude ?? undefined,
        longitude: restaurant.longitude ?? undefined,
      });
      // Auto-géocode si l'adresse est renseignée mais les coordonnées GPS sont absentes
      if (restaurant.localisation && !restaurant.latitude && !restaurant.longitude) {
        geocodeAddressServer(restaurant.localisation).then((coords) => {
          if (coords) {
            methods.setValue('latitude', coords.lat);
            methods.setValue('longitude', coords.lng);
          }
        }).catch(() => {});
      }
    }
  }, [restaurant, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const typeCommission = watch('typeCommission');

  // Mêmes réductions qu'à la création : la modification passe par le même service, avec la
  // même limite de 10 Mo par requête.
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reduit = await compresserImage(file);
    setLogoFile(reduit);
    setLogoPreview(URL.createObjectURL(reduit));
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reduit = await compresserImage(file);
    setCoverFile(reduit);
    setCoverPreview(URL.createObjectURL(reduit));
  }

  async function handlePicturesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const reduits = await compresserImages(Array.from(e.target.files));
    const combined = [...pictureFiles, ...reduits].slice(0, 8);
    setPictureFiles(combined);
    setPicturePreviews(combined.map((f) => URL.createObjectURL(f)));
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
    if (username) fd.append('username', username);
    if (password) fd.append('password', password);
    horaires.forEach((h, i) => {
      fd.append(`openingHours[${i}][dayOfWeek]`, h.jour);
      fd.append(`openingHours[${i}][openingTime]`, h.ouverture);
      fd.append(`openingHours[${i}][closingTime]`, h.fermeture);
      fd.append(`openingHours[${i}][closed]`, String(h.ferme));
    });
    const result = await updateRestaurant(restaurant.id, fd);
    setIsSubmitting(false);
    if (result.status === 'success') {
      toast.success(result.message);
      await invalidateRestaurants();
      router.push('/restaurants');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="pb-24">
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

      <FormProvider {...methods}>
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
            typeCommission={typeCommission ?? ''}
          />

          <CommissionHistorySection restaurantId={restaurant.id} />

          <CompteSection
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
          />

          <PhotosSection
            existingPictures={existingPictures}
            picturePreviews={picturePreviews}
            pictureRef={pictureRef}
            onPicturesChange={handlePicturesChange}
            onRemoveExisting={(id) => setExistingPictureIds((prev) => prev.filter((p) => p !== id))}
            onRemoveNew={(index) => {
              const next = pictureFiles.filter((_, i) => i !== index);
              setPictureFiles(next);
              setPicturePreviews(next.map((f) => URL.createObjectURL(f)));
            }}
          />

          <HorairesSection horaires={horaires} setHoraires={setHoraires} />

          <AutresDocumentsSection
            autreDocType={autreDocType}
            setAutreDocType={setAutreDocType}
            autreDocFile={autreDocFile}
            setAutreDocFile={setAutreDocFile}
            autreDocRef={autreDocRef}
          />

          <div className="fixed bottom-[calc(52px+env(safe-area-inset-bottom))] left-0 right-0 lg:bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 z-10">
            <Button type="button" variant="flat" as={Link} href="/restaurants">Annuler</Button>
            <Button type="submit" color="primary" isLoading={isSubmitting}>Enregistrer</Button>
          </div>

        </form>
      </FormProvider>
    </div>
  );
}
