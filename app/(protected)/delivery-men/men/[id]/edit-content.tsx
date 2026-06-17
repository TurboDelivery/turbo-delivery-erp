'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Avatar, Button, Chip, Spinner, Tab, Tabs } from '@heroui/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  updateTurboyInfoSchema,
  type UpdateTurboyInfoDTO,
} from '@/features/turboys/schemas/update-turboy-info.schema';
import { useQueryClient } from '@tanstack/react-query';
import { updateLivreur } from '@/features/turboys/actions/update-turboy-info.action';
import { useTurboyQuery, turboyKeys } from '@/features/turboys/queries/turboy-list.query';
import { useDeleteTurboyMutation } from '@/features/turboys/queries';
import { useAbility } from '@/hooks/use-ability';
import { StatusChip } from '@/features/men/components/status-chip';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { toAbsoluteUrl } from './_components/to-absolute-url';
import { SectionDocumentsActuels } from './_components/section-documents-actuels';
import { SectionPhotoProfil } from './_components/section-photo-profil';
import { SectionInfosPersonnelles } from './_components/section-infos-personnelles';
import { SectionDocumentIdentite } from './_components/section-document-identite';
import { SectionVehicule } from './_components/section-vehicule';
import { SectionCompte } from './_components/section-compte';
import { SectionAvenantsCommission } from './_components/section-avenants-commission';
import CompteHabilitationPanel from '@/components/turboys/compte/compte-habilitation-panel';
import PointagesSection from '@/components/turboys/pointages/pointages-section';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

  // Suppression d'un coursier : action irréversible réservée au DG.
  // `can('manage','all')` n'est accordé qu'au DG (les autres rôles d'édition
  // n'ont que `manage Livreur`) — voir lib/casl/ability.ts.
  const ability = useAbility();
  const canDelete = ability.can('manage', 'all');
  const [openDelete, setOpenDelete] = useState(false);
  const deleteMutation = useDeleteTurboyMutation(() => router.push('/delivery-men/men'));

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

  const typeDisplay = getTurboyTypeDisplay(turboy.typeLivreur);
  const assignationChip =
    turboy.type === 'TURBO' ? (
      <Chip color="success" size="sm" variant="flat">Assigné</Chip>
    ) : turboy.type === 'FREE' ? (
      <Chip color="primary" size="sm" variant="flat">Bird / Libre</Chip>
    ) : turboy.type === 'WAITING' ? (
      <Chip color="warning" size="sm" variant="flat">{"En attente d'assignation"}</Chip>
    ) : (
      <Chip color="default" size="sm" variant="flat">Non assigné</Chip>
    );

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <Link
        href="/delivery-men/men"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      {/* En-tête identité — synthèse du coursier en un coup d'œil */}
      <div className="bg-white rounded-xl border border-default-200 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar
            src={toAbsoluteUrl(turboy.avatarUrl) ?? undefined}
            name={`${turboy.prenoms} ${turboy.nom}`}
            className="w-16 h-16 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {turboy.prenoms} {turboy.nom}
            </h1>
            <p className="text-sm text-gray-400">
              {turboy.matricule ?? turboy.id}
              {turboy.telephone ? ` · ${turboy.telephone}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Chip color={typeDisplay.chipColor} size="sm" variant="flat">
                {typeDisplay.label}
              </Chip>
              <StatusChip status={turboy.status} />
              {assignationChip}
              {turboy.cote != null && (
                <Chip color="secondary" size="sm" variant="flat">
                  Cote {turboy.cote}/100
                </Chip>
              )}
            </div>
          </div>
          {canDelete && (
            <Button
              color="danger"
              variant="flat"
              startContent={<Trash2 className="w-4 h-4" />}
              onPress={() => setOpenDelete(true)}
              className="shrink-0"
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <Tabs
        aria-label="Sections du coursier"
        variant="underlined"
        color="primary"
        classNames={{ tabList: 'gap-6', panel: 'pt-6' }}
        destroyInactiveTabPanel={false}
      >
        <Tab key="profil" title="Profil & documents">
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
        </Tab>

        <Tab key="habilitation" title="Habilitation & pièces">
          {/* M1 — validation, conformité des pièces, clé d'activation, historique */}
          <CompteHabilitationPanel driverId={id} />
        </Tab>

        <Tab key="activite" title="Activité & pointages">
          {/* M3 — cote de fiabilité, montée / relances / fin / hors-zone */}
          <PointagesSection driverId={id} />
        </Tab>
      </Tabs>

      {/* Suppression — réservée au DG, action irréversible */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le coursier</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement{' '}
              <strong>
                {turboy.prenoms} {turboy.nom}
              </strong>{' '}? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(id)}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
