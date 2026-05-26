'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button, Spinner } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import {
  updateTurboyInfoSchema,
  type UpdateTurboyInfoDTO,
} from '@/features/turboys/schemas/update-turboy-info.schema';
import { useQueryClient } from '@tanstack/react-query';
import { updateLivreur } from '@/features/turboys/actions/update-turboy-info.action';
import { useTurboyQuery, turboyKeys } from '@/features/turboys/queries/turboy-list.query';
import { toAbsoluteUrl } from './_components/to-absolute-url';
import { SectionDocumentsActuels } from './_components/section-documents-actuels';
import { SectionPhotoProfil } from './_components/section-photo-profil';
import { SectionInfosPersonnelles } from './_components/section-infos-personnelles';
import { SectionDocumentIdentite } from './_components/section-document-identite';
import { SectionVehicule } from './_components/section-vehicule';
import { SectionCompte } from './_components/section-compte';
import { SectionAvenantsCommission } from './_components/section-avenants-commission';

export default function EditContent({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: turboy, isLoading, isError } = useTurboyQuery(id);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cniFiles, setCniFiles] = useState<File[]>([]);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [avenantFiles, setAvenantFiles] = useState<File[]>([]);
  // V48 — fiche d'identification (PDF/image)
  const [ficheIdentificationFile, setFicheIdentificationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateTurboyInfoDTO>({
    resolver: zodResolver(updateTurboyInfoSchema),
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
      commission: undefined,
      // V48
      numeroPersonneAContacter: '',
      permisConduire: false,
    },
  });

  useEffect(() => {
    if (turboy) {
      console.log('📎 Documents livreur:', {
        avatarUrl: turboy.avatarUrl,
        cniUrlR: turboy.cniUrlR,
        cniUrlV: turboy.cniUrlV,
        vehiclePhotoUrl: turboy.vehiclePhotoUrl,
        contratUrl: turboy.contratUrl,
        raw: turboy,
      });
      setAvatarPreview(toAbsoluteUrl(turboy.avatarUrl));
      reset({
        nom: turboy.nom ?? '',
        prenoms: turboy.prenoms ?? '',
        birthDay: turboy.birthDay ?? '',
        habitation: turboy.habitation ?? '',
        telephone: turboy.telephone ?? '',
        email: turboy.email ?? '',
        typeDocument: turboy.typeDocument ?? '',
        numeroCni: turboy.numeroCni ?? '',
        typeVehicule: turboy.typeVehicule ?? '',
        nomVehicule: turboy.nomVehicule ?? '',
        immatriculation: turboy.immatriculation ?? '',
        telephoneCompte: turboy.telephoneCompte ?? turboy.telephone ?? '',
        commission: turboy.commission ?? undefined,
        // V48 : pré-remplir si déjà set en base, sinon valeurs neutres
        numeroPersonneAContacter: turboy.numeroPersonneAContacter ?? '',
        permisConduire: turboy.permisConduire ?? false,
      });
    }
  }, [turboy, reset]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: UpdateTurboyInfoDTO) {
    setIsSubmitting(true);
    const fd = new FormData();
    // V48 : permisConduire est boolean — on envoie aussi false explicitement
    // (le backend accepte true/false/null ; "" est filtré pour les strings).
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v === '') return;
      fd.append(k, String(v));
    });
    if (avatarFile) fd.append('avatar', avatarFile);
    cniFiles.forEach((f, i) => fd.append(`cni_${i}`, f));
    if (vehicleFile) fd.append('vehiclePhoto', vehicleFile);
    if (contratFile) fd.append('contrat', contratFile);
    avenantFiles.forEach((f) => fd.append('avenants', f));
    // V48 — fiche d'identification (PDF/image), only if user a uploadé un nouveau
    if (ficheIdentificationFile) fd.append('ficheIdentification', ficheIdentificationFile);

    const result = await updateLivreur(id, fd);
    setIsSubmitting(false);
    if (result.status === 'success') {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      toast.success(result.message);
      router.push('/delivery-men/men');
    } else {
      toast.error(result.message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner color="primary" />
      </div>
    );
  }

  if (isError || !turboy) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">Impossible de charger les données du livreur.</p>
        <Button variant="flat" onPress={() => router.push('/delivery-men/men')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <Link
        href="/delivery-men/men"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-1">Modifier le profil</h1>
      <p className="text-sm text-gray-500 mb-8">
        {turboy.prenoms} {turboy.nom} — {turboy.matricule ?? turboy.id}
      </p>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <SectionDocumentsActuels
          avatarUrl={turboy.avatarUrl}
          cniUrlR={turboy.cniUrlR}
          cniUrlV={turboy.cniUrlV}
          vehiclePhotoUrl={turboy.vehiclePhotoUrl}
          contratUrl={turboy.contratUrl}
          avenants={turboy.avenantUrls}
        />

        <SectionPhotoProfil
          avatarPreview={avatarPreview}
          prenom={turboy.prenoms}
          contratFile={contratFile}
          onAvatarChange={handleAvatarChange}
          onContratChange={setContratFile}
        />

        <SectionInfosPersonnelles control={control} errors={errors} />

        <SectionDocumentIdentite
          control={control}
          errors={errors}
          cniFiles={cniFiles}
          onCniChange={setCniFiles}
          ficheIdentificationFile={ficheIdentificationFile}
          onFicheIdentificationChange={setFicheIdentificationFile}
        />

        <SectionVehicule
          control={control}
          errors={errors}
          vehicleFile={vehicleFile}
          onVehicleChange={setVehicleFile}
        />

        <SectionCompte control={control} errors={errors} />

        <SectionAvenantsCommission
          control={control}
          errors={errors}
          avenantFiles={avenantFiles}
          existingAvenants={turboy.avenantUrls}
          onAvenantsChange={setAvenantFiles}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="flat" as={Link} href="/delivery-men/men">
            Annuler
          </Button>
          <Button type="submit" color="primary" isLoading={isSubmitting}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
