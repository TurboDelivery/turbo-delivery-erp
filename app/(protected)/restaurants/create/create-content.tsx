'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { ArrowLeft, Camera, Upload, Plus, FileText } from 'lucide-react';
import {
  createRestaurantSchema,
  type CreateRestaurantDTO,
  METHOD_RECOUVREMENT_OPTIONS,
  TYPE_COMMISSION_OPTIONS,
} from '@/features/restaurants/schemas/create-restaurant.schema';
import { createRestaurant } from '@/features/restaurants/actions/create-restaurant.action';

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-primary">{icon}</span>
      <h2 className="text-base font-semibold text-gray-800">{children}</h2>
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({
  label,
  multiple,
  previews,
  onChange,
}: {
  label: string;
  multiple?: boolean;
  previews?: string[];
  onChange: (files: FileList | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {previews?.map((src, i) => (
        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
          <img src={src} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors shrink-0"
      >
        {(previews?.length ?? 0) === 0 ? (
          <>
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-[10px] text-center leading-tight px-1">{label}</span>
          </>
        ) : (
          <Plus className="w-5 h-5" />
        )}
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

// ─── File input (for PDF/docs) ────────────────────────────────────────────────
function FileInputRow({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm w-full">
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate">{file ? file.name : label}</span>
      </div>
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function CreateContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [picturePreviews, setPicturePreviews] = useState<string[]>([]);

  const logoRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateRestaurantDTO>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      nomEtablissement: '',
      description: '',
      email: '',
      telephone: '',
      codePostal: '',
      commune: '',
      localisation: '',
      siteWeb: '',
      typeCommission: '',
      commission: 0,
      methodRecouvrement: undefined,
    },
  });

  const typeCommission = watch('typeCommission');

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handlePicturesChange(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    const combined = [...pictureFiles, ...newFiles].slice(0, 6);
    setPictureFiles(combined);
    setPicturePreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(values: CreateRestaurantDTO) {
    setIsSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== '') fd.append(k, String(v));
    });
    if (logoFile) fd.append('logo', logoFile);
    if (cniFile) fd.append('cni', cniFile);
    if (documentFile) fd.append('document', documentFile);
    pictureFiles.forEach((f, i) => fd.append(`picture_${i}`, f));

    const result = await createRestaurant(fd);
    setIsSubmitting(false);
    if (result.status === 'success') {
      toast.success(result.message);
      router.push('/restaurants');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Back link */}
      <Link
        href="/restaurants"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-1">Créer un profil</h1>
      <p className="text-sm text-gray-500 mb-8">Enregistrer un nouveau restaurant dans le système</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* ── Logo / Photo de profil ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={<span>👤</span>}>Photo de profil</SectionTitle>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-primary/30"
                onClick={() => logoRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-xl">R</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow"
              >
                <Camera className="w-3 h-3" />
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Téléchargez une photo</p>
              <p className="text-xs text-gray-400">JPG, PNG ou GIF (max: 2MB)</p>
            </div>
          </div>
        </section>

        {/* ── Informations générales ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={<span>👤</span>}>Informations générales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="nomEtablissement"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Nom de l'établissement" placeholder="Mon Restaurant" isInvalid={!!errors.nomEtablissement} errorMessage={errors.nomEtablissement?.message} variant="bordered" />
              )}
            />
            <Controller
              name="telephone"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Téléphone" placeholder="+225 0000000000" isInvalid={!!errors.telephone} errorMessage={errors.telephone?.message} variant="bordered" startContent={<span className="text-gray-400 text-sm">📞</span>} />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input {...field} type="email" label="Adresse mail" placeholder="restaurant@example.com" isInvalid={!!errors.email} errorMessage={errors.email?.message} variant="bordered" startContent={<span className="text-gray-400 text-sm">✉️</span>} />
              )}
            />
            <Controller
              name="localisation"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Adresse / Localisation" placeholder="Adresse complète" isInvalid={!!errors.localisation} errorMessage={errors.localisation?.message} variant="bordered" startContent={<span className="text-gray-400 text-sm">📍</span>} />
              )}
            />
            <Controller
              name="commune"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Commune" placeholder="Cocody" isInvalid={!!errors.commune} errorMessage={errors.commune?.message} variant="bordered" />
              )}
            />
            <Controller
              name="codePostal"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Code postal" placeholder="00225" isInvalid={!!errors.codePostal} errorMessage={errors.codePostal?.message} variant="bordered" />
              )}
            />
            <Controller
              name="siteWeb"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Site web (facultatif)" placeholder="https://www.site.com" isInvalid={!!errors.siteWeb} errorMessage={errors.siteWeb?.message} variant="bordered" className="sm:col-span-2" />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea {...field} label="Description" placeholder="Décrivez votre établissement..." isInvalid={!!errors.description} errorMessage={errors.description?.message} variant="bordered" className="sm:col-span-2" minRows={3} />
              )}
            />
          </div>
        </section>

        {/* ── Documents légaux ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={<span>🪪</span>}>Documents légaux</SectionTitle>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">CNI du propriétaire</p>
              <FileInputRow label="Importer la CNI (PDF, JPG, PNG)" file={cniFile} onChange={setCniFile} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Document légal (Registre de commerce, etc.)</p>
              <FileInputRow label="Importer le document (PDF, JPG, PNG)" file={documentFile} onChange={setDocumentFile} />
            </div>
          </div>
        </section>

        {/* ── Photos de l'établissement ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={<span>🏪</span>}>Photos de l'établissement</SectionTitle>
          <p className="text-xs text-gray-400 mb-3">Maximum 6 photos</p>
          <UploadZone
            label="Ajouter une photo"
            multiple
            previews={picturePreviews}
            onChange={handlePicturesChange}
          />
          {pictureFiles.length > 0 && (
            <p className="text-xs text-green-600 mt-2">{pictureFiles.length} photo(s) sélectionnée(s)</p>
          )}
        </section>

        {/* ── Configuration financière ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={<span>⚙️</span>}>Configuration financière</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="typeCommission"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type de commission"
                  placeholder="Sélectionner un type"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? '')}
                  variant="bordered"
                >
                  {TYPE_COMMISSION_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
                </Select>
              )}
            />
            {(typeCommission === 'POURCENTAGE' || typeCommission === 'FIXE') && (
              <Controller
                name="commission"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value?.toString() ?? '0'}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    type="number"
                    label={typeCommission === 'POURCENTAGE' ? 'Commission (%)' : 'Commission (montant fixe)'}
                    placeholder={typeCommission === 'POURCENTAGE' ? '10' : '5000'}
                    min={0}
                    max={typeCommission === 'POURCENTAGE' ? 100 : undefined}
                    variant="bordered"
                  />
                )}
              />
            )}
            <Controller
              name="methodRecouvrement"
              control={control}
              render={({ field }) => (
                <Select
                  label="Cycle de paiement"
                  placeholder="Sélectionner une période"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? undefined)}
                  variant="bordered"
                >
                  {METHOD_RECOUVREMENT_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
                </Select>
              )}
            />
          </div>
        </section>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="flat" as={Link} href="/restaurants">
            Annuler
          </Button>
          <Button type="submit" color="primary" isLoading={isSubmitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
