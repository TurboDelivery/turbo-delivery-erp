'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { ArrowLeft, Camera, Upload, Plus, Eye, EyeOff } from 'lucide-react';
import {
  createTurboySchema,
  type CreateTurboyDTO,
  TYPE_DOCUMENT_OPTIONS,
  TYPE_VEHICULE_OPTIONS,
} from '@/features/turboys/schemas/create-turboy.schema';
import { createLivreur } from '@/features/turboys/actions/create-turboy.action';

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

// ─── File upload zone ─────────────────────────────────────────────────────────
function UploadZone({
  label,
  preview,
  onChange,
  multiple,
}: {
  label: string;
  preview?: string | null;
  onChange: (files: FileList | null) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <>
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-[10px] text-center leading-tight">{label}</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4" />
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

// ─── Main form ────────────────────────────────────────────────────────────────
export default function CreateContent() {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cniFiles, setCniFiles] = useState<File[]>([]);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTurboyDTO>({
    resolver: zodResolver(createTurboySchema),
    defaultValues: {
      nom: '',
      prenoms: '',
      birthDay: '',
      habitation: '',
      telephone: '',
      email: '',
      typeDocument: '',
      numeroCni: '',
      typeVehicule: '',
      nomVehicule: '',
      immatriculation: '',
      telephoneCompte: '',
      password: '',
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: CreateTurboyDTO) {
    setIsSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (avatarFile) fd.append('avatar', avatarFile);
    cniFiles.forEach((f, i) => fd.append(`cni_${i}`, f));
    if (vehicleFile) fd.append('vehiclePhoto', vehicleFile);

    const result = await createLivreur(fd);
    setIsSubmitting(false);
    if (result.status === 'success') {
      toast.success(result.message);
      router.push('/delivery-men/men');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Back link */}
      <Link
        href="/delivery-men/men"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold text-primary mb-1">Créer un nouveau profil</h1>
      <p className="text-sm text-gray-500 mb-8">Enregistrer un nouveau coursier dans le système</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {/* ── Photo de profil ── */}
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
                  <span className="text-primary font-bold text-xl">?</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow"
              >
                <Camera className="w-3 h-3" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Téléchargez une photo</p>
              <p className="text-xs text-gray-400">JPG, PNG ou GIF (max: 2MB)</p>
            </div>
          </div>
        </section>

        {/* ── Informations personnelles ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>Informations personnelles</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="nom"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Nom" placeholder="Douze" isInvalid={!!errors.nom} errorMessage={errors.nom?.message} variant="bordered" />
              )}
            />
            <Controller
              name="prenoms"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Prénom" placeholder="Ousmane" isInvalid={!!errors.prenoms} errorMessage={errors.prenoms?.message} variant="bordered" />
              )}
            />
            <Controller
              name="birthDay"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" label="Date de naissance" isInvalid={!!errors.birthDay} errorMessage={errors.birthDay?.message} variant="bordered" startContent={<span className="text-gray-400 text-sm">📅</span>} />
              )}
            />
            <Controller
              name="habitation"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Domicile" placeholder="Koumasi Zone 4" isInvalid={!!errors.habitation} errorMessage={errors.habitation?.message} variant="bordered" startContent={<span className="text-gray-400 text-sm">🏠</span>} />
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
                <Input {...field} type="email" label="Adresse mail" placeholder="email@example.com" isInvalid={!!errors.email} errorMessage={errors.email?.message} variant="bordered" startContent={<span className="text-gray-400 text-sm">✉️</span>} />
              )}
            />
          </div>
        </section>

        {/* ── Document d'identité ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>Document d'identité</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Controller
              name="typeDocument"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type de document"
                  placeholder="Sélectionner un type"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? '')}
                  isInvalid={!!errors.typeDocument}
                  errorMessage={errors.typeDocument?.message}
                  variant="bordered"
                >
                  {TYPE_DOCUMENT_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
                </Select>
              )}
            />
            <Controller
              name="numeroCni"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Numéro de la pièce" placeholder="CI0000000000" isInvalid={!!errors.numeroCni} errorMessage={errors.numeroCni?.message} variant="bordered" />
              )}
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Photo de la pièce (max 2)</p>
            <UploadZone
              label="Importer"
              multiple
              onChange={(files) => {
                if (files) setCniFiles(Array.from(files).slice(0, 2));
              }}
            />
            {cniFiles.length > 0 && (
              <p className="text-xs text-green-600 mt-2">{cniFiles.length} fichier(s) sélectionné(s)</p>
            )}
          </div>
        </section>

        {/* ── Informations du véhicule ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>Informations du véhicule</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Controller
              name="typeVehicule"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type"
                  placeholder="Sélectionner un type"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys as Set<string>)[0] ?? '')}
                  isInvalid={!!errors.typeVehicule}
                  errorMessage={errors.typeVehicule?.message}
                  variant="bordered"
                >
                  {TYPE_VEHICULE_OPTIONS.map((o) => <SelectItem key={o.value}>{o.label}</SelectItem>)}
                </Select>
              )}
            />
            <Controller
              name="nomVehicule"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Nom du véhicule" placeholder="KTML 31" isInvalid={!!errors.nomVehicule} errorMessage={errors.nomVehicule?.message} variant="bordered" />
              )}
            />
            <Controller
              name="immatriculation"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Immatriculation du véhicule" placeholder="CI0000000000" isInvalid={!!errors.immatriculation} errorMessage={errors.immatriculation?.message} variant="bordered" className="sm:col-span-2" />
              )}
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Photo du véhicule</p>
            <UploadZone
              label="Ajouter une photo"
              onChange={(files) => { if (files?.[0]) setVehicleFile(files[0]); }}
            />
            {vehicleFile && (
              <p className="text-xs text-green-600 mt-2">{vehicleFile.name}</p>
            )}
          </div>
        </section>

        {/* ── Compte du livreur ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>Compte du livreur</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="telephoneCompte"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Numéro de téléphone" placeholder="0930000300" isInvalid={!!errors.telephoneCompte} errorMessage={errors.telephoneCompte?.message} variant="bordered" />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  label="Mot de passe"
                  placeholder="••••••••"
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                  variant="bordered"
                  endContent={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              )}
            />
          </div>
        </section>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="flat"
            as={Link}
            href="/delivery-men/men"
          >
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
