'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { ArrowLeft, ImagePlus, Pencil, Plus, Settings } from 'lucide-react';
import {
  updateRestaurantSchema,
  type UpdateRestaurantDTO,
  METHOD_RECOUVREMENT_OPTIONS,
  TYPE_COMMISSION_OPTIONS,
} from '@/features/restaurants/schemas/update-restaurant.schema';
import { updateRestaurant } from '@/features/restaurants/actions/update-restaurant.action';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { createUrlFile } from '@/utils/createUrlFile';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

const AUTRES_DOCUMENTS_OPTIONS = [
  { value: 'contrat', label: 'Avenant au contrat' },
  { value: 'rib', label: 'RIB bancaire' },
  { value: 'attestation', label: 'Attestation fiscale' },
  { value: 'autre', label: 'Autre document' },
];

const DAY_LABELS: Record<string, string> = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
};

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;

interface Horaire {
  jour: string;
  ouverture: string;
  fermeture: string;
  ferme: boolean;
}

export default function EditContent({ restaurant }: { restaurant: IRestaurant }) {
  const router = useRouter();
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
  const [existingPictureIds, setExistingPictureIds] = useState<string[]>(() => restaurant.pictures?.map((p) => p.id) ?? []);
  const [contacts, setContacts] = useState<{ nom: string; telephone: string }[]>([{ nom: '', telephone: '' }]);
  const [autreDocType, setAutreDocType] = useState('contrat');
  const [autreDocFile, setAutreDocFile] = useState<File | null>(null);
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
  const existingPictures = restaurant.pictures?.filter((p) => existingPictureIds.includes(p.id)).map((p) => ({ id: p.id, url: createUrlFile(p.pictureUrl, 'restaurant') })) ?? [];

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
    const added = Array.from(e.target.files);
    const combined = [...pictureFiles, ...added].slice(0, 8);
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
    // Champs texte
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        fd.append(key, String(val));
      }
    });
    // Fichiers
    if (logoFile) fd.append('logo', logoFile);
    if (coverFile) fd.append('coverImage', coverFile);
    pictureFiles.forEach((f) => fd.append('pictures', f));
    existingPictureIds.forEach((id) => fd.append('existingPictureIds', id));
    if (autreDocFile) { fd.append('document', autreDocFile); fd.append('documentType', autreDocType); }
    // Horaires
    horaires.forEach((h, i) => {
      fd.append(`openingHours[${i}][dayOfWeek]`, h.jour);
      fd.append(`openingHours[${i}][openingTime]`, h.ouverture);
      fd.append(`openingHours[${i}][closingTime]`, h.fermeture);
      fd.append(`openingHours[${i}][closed]`, String(h.ferme));
    });
    // Debug
    console.log('📋 FormData horaires:', horaires.map((h, i) => ({ [`[${i}]`]: h })));
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

        {/* Cover + Logo */}
        <div className="relative">
          <div
            className="relative h-40 w-full rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => coverRef.current?.click()}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-gray-400">Aucune image</span>
            )}
            <button
              type="button"
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-primary hover:text-primary transition-colors"
              onClick={(e) => { e.stopPropagation(); coverRef.current?.click(); }}
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Modifier la couverture
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Logo */}
          <div className="absolute left-4 -bottom-10">
            <div
              className="w-16 h-16 rounded-xl border-2 border-white bg-gray-200 overflow-hidden cursor-pointer shadow"
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
              className="mt-1 w-full text-[11px] text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Modifier
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </div>
        <div className="mt-10" />

        {/* Informations Générales */}
        <section>
          <SectionTitle>Informations Générales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller name="nomEtablissement" control={control} render={({ field }) => (
              <Input {...field} label="Nom de l'établissement" variant="bordered" isInvalid={!!errors.nomEtablissement} errorMessage={errors.nomEtablissement?.message} />
            )} />
            <Controller name="localisation" control={control} render={({ field }) => (
              <Input {...field} label="Localisation" variant="bordered" />
            )} />
            <Controller name="telephone" control={control} render={({ field }) => (
              <Input {...field} label="Téléphone" variant="bordered" isInvalid={!!errors.telephone} errorMessage={errors.telephone?.message} />
            )} />
            <Controller name="commune" control={control} render={({ field }) => (
              <Input {...field} label="Commune" variant="bordered" />
            )} />
            <Controller name="codePostal" control={control} render={({ field }) => (
              <Input {...field} label="Code Postal" variant="bordered" />
            )} />
            <Select label="Type d'entreprise" defaultSelectedKeys={['restaurant']} variant="bordered">
              <SelectItem key="restaurant">Restaurant</SelectItem>
              <SelectItem key="cafe">Café</SelectItem>
              <SelectItem key="bar">Bar</SelectItem>
            </Select>
            <Controller name="email" control={control} render={({ field }) => (
              <Input {...field} type="email" label="Email" variant="bordered" isInvalid={!!errors.email} errorMessage={errors.email?.message} />
            )} />
            <Controller name="siteWeb" control={control} render={({ field }) => (
              <Input {...field} label="Site web (si disponible)" variant="bordered" />
            )} />
            <Controller name="description" control={control} render={({ field }) => (
              <Textarea {...field} label="Description" variant="bordered" className="sm:col-span-2" minRows={3} />
            )} />

            {contacts.map((c, i) => (
              <React.Fragment key={i}>
                <Input
                  label={`Nom et prénom d'un contact ${i + 1}`}
                  variant="bordered"
                  value={c.nom}
                  onChange={(e) => { const next = [...contacts]; next[i].nom = e.target.value; setContacts(next); }}
                />
                <Input
                  label="Numéro de téléphone"
                  variant="bordered"
                  value={c.telephone}
                  onChange={(e) => { const next = [...contacts]; next[i].telephone = e.target.value; setContacts(next); }}
                />
              </React.Fragment>
            ))}

            <div className="sm:col-span-2">
              <Button
                type="button" variant="bordered" size="sm"
                startContent={<Plus className="w-4 h-4" />}
                className="w-full border-dashed text-gray-500"
                onPress={() => setContacts([...contacts, { nom: '', telephone: '' }])}
              >
                Ajouter un autre contact
              </Button>
            </div>
          </div>
        </section>

        {/* Type de commission */}
        <section>
          <SectionTitle>Type de commission</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-2 items-end">
              <Controller name="typeCommission" control={control} render={({ field }) => (
                <Select
                  label="Choisissez le type de commission"
                  placeholder="Choisissez le type de commission"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? '')}
                  variant="bordered"
                  className="flex-1"
                >
                  {TYPE_COMMISSION_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
                </Select>
              )} />
              {(typeCommission === 'POURCENTAGE' || typeCommission === 'FIXE') && (
                <Controller name="commission" control={control} render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value?.toString() ?? '0'}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    type="number" className="w-24 shrink-0" variant="bordered"
                    min={0} max={typeCommission === 'POURCENTAGE' ? 100 : undefined}
                  />
                )} />
              )}
            </div>
            <Controller name="methodRecouvrement" control={control} render={({ field }) => (
              <Select
                label="Choisissez la période de recouvrement"
                placeholder="Choisissez la période de recouvrement"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? undefined)}
                variant="bordered"
              >
                {METHOD_RECOUVREMENT_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
              </Select>
            )} />
          </div>
        </section>

        {/* Compte du partenaire */}
        <section>
          <SectionTitle>Compte du partenaire</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nom utilisateur" variant="bordered" />
            <Input label="Mot de passe" type="password" variant="bordered" />
          </div>
        </section>

        {/* Photos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Photos de l'établissement</p>
            <span className="text-xs text-gray-400">{existingPictures.length + picturePreviews.length} / 8</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {existingPictures.map(({ id, url }) => (
              <div key={id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPicture(id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                >✕</button>
              </div>
            ))}
            {picturePreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-primary/40 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPicture(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                >✕</button>
              </div>
            ))}
            {(existingPictures.length + picturePreviews.length) < 8 && (
              <button
                type="button"
                onClick={() => pictureRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors gap-1"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[10px]">Ajouter</span>
              </button>
            )}
            <input ref={pictureRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePicturesChange} />
          </div>
        </section>

        {/* Horaires d'ouverture */}
        <section>
          <p className="text-sm font-medium text-gray-700 mb-3">Horaires d'ouverture</p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {horaires.map((h, i) => (
              <div key={h.jour} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                <span className="font-medium text-gray-700 w-24">{DAY_LABELS[h.jour]}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
                  <input
                    type="checkbox"
                    checked={h.ferme}
                    onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, ferme: e.target.checked } : x))}
                    className="accent-primary"
                  />
                  Fermé
                </label>
                {!h.ferme && (
                  <>
                    <input
                      type="time"
                      value={h.ouverture}
                      onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, ouverture: e.target.value } : x))}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      value={h.fermeture}
                      onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, fermeture: e.target.value } : x))}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Autres Documents */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Autres Documents</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">Sélectionnez un document fourni par de l'entreprise</p>
          <div className="flex items-center gap-3">
            <Select
              className="flex-1"
              variant="bordered"
              size="sm"
              selectedKeys={[autreDocType]}
              onSelectionChange={(keys) => setAutreDocType(Array.from(keys as Set<string>)[0] ?? 'contrat')}
            >
              {AUTRES_DOCUMENTS_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
            </Select>
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition-colors shrink-0 whitespace-nowrap">
              ⬆ {autreDocFile ? autreDocFile.name : 'Importer fichier .pdf ou .png ou .jpg'}
              <input ref={autreDocRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setAutreDocFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </section>

        {/* Footer fixe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 z-10">
          <Button type="button" variant="flat" as={Link} href="/restaurants">Annuler</Button>
          <Button type="submit" color="primary" isLoading={isSubmitting}>Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
