'use client';

import { useEffect, useState } from 'react';
import { LienBouton } from '@/components/commons/LienBouton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  Chip,
  Spinner,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui-v3/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  updateTurboyInfoSchema,
  type UpdateTurboyInfoDTO,
} from '@/features/turboys/schemas/update-turboy-info.schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { updateLivreur } from '@/features/turboys/actions/update-turboy-info.action';
import { useTurboyQuery, turboyKeys } from '@/features/turboys/queries/turboy-list.query';
import { useDeleteTurboyMutation } from '@/features/turboys/queries';
import { useAbility } from '@/hooks/use-ability';
import { StatusChip } from '@/features/men/components/status-chip';
import { TurboyActionMenu } from '@/features/men/components/turboy-action-menu';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
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
  const [onglet, setOnglet] = useState('profil');

  // Suppression d'un coursier : action irréversible réservée au DG.
  // `can('manage','all')` n'est accordé qu'au DG (les autres rôles d'édition
  // n'ont que `manage Livreur`) — voir lib/casl/ability.ts.
  const ability = useAbility();
  const canDelete = ability.can('manage', 'all');
  const [openDelete, setOpenDelete] = useState(false);
  const deleteMutation = useDeleteTurboyMutation(() => router.push('/delivery-men/men'));

  // Restaurants pour l'action « Assigner » du menu cycle-de-vie rendu dans l'en-tête.
  const { data: restaurants } = useQuery({
    queryKey: ['restaurants', 'all', 'detail-livreur'],
    queryFn: getAllRestaurants,
    staleTime: 5 * 60 * 1000,
  });

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
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !turboy) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted">Impossible de charger les données du livreur.</p>
        <Button onPress={() => router.push('/delivery-men/men')} variant="outline">
          Retour
        </Button>
      </div>
    );
  }

  const typeDisplay = getTurboyTypeDisplay(turboy.typeLivreur);
  /* Meme echelle que dans la liste : `color` dit le sens, `variant` l'intensite. */
  const ASSIGNATION: Record<string, { couleur: 'default' | 'success' | 'warning'; libelle: string }> = {
    FREE: { couleur: 'default', libelle: 'Bird / Libre' },
    TURBO: { couleur: 'success', libelle: 'Assigné' },
    WAITING: { couleur: 'warning', libelle: "En attente d'assignation" },
  };
  const assignation = ASSIGNATION[turboy.type ?? ''];
  const assignationChip = (
    <Chip color={assignation?.couleur ?? 'default'} size="sm" variant="soft">
      <Chip.Label>{assignation?.libelle ?? 'Non assigné'}</Chip.Label>
    </Chip>
  );

  return (
    <div className="pb-16">
      <Link
        href="/delivery-men/men"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      {/* En-tête identité — synthèse du coursier en un coup d'œil */}
      <Card className="mb-6">
        <Card.Content className="flex-row flex-wrap items-center gap-4">
          <Avatar className="size-16 shrink-0">
            {toAbsoluteUrl(turboy.avatarUrl) && (
              <Avatar.Image
                alt={`${turboy.prenoms} ${turboy.nom}`}
                src={toAbsoluteUrl(turboy.avatarUrl) as string}
              />
            )}
            <Avatar.Fallback>
              {`${turboy.prenoms?.[0] ?? ''}${turboy.nom?.[0] ?? ''}`.toUpperCase()}
            </Avatar.Fallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-foreground">
              {turboy.prenoms} {turboy.nom}
            </h1>
            <p className="text-sm text-muted">
              {turboy.matricule ?? turboy.id}
              {turboy.telephone ? ` · ${turboy.telephone}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Le type de contrat est une étiquette de catégorie, pas un état :
                  sur cet en-tête la couleur est réservée au compte et à l'affectation. */}
              <Chip size="sm" variant="soft">
                <Chip.Label>{typeDisplay.label}</Chip.Label>
              </Chip>
              <StatusChip status={turboy.status} />
              {assignationChip}
              {turboy.cote != null && (
                <Chip size="sm" variant="soft">
                  <Chip.Label>Cote {turboy.cote}/100</Chip.Label>
                </Chip>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Cycle de vie DEPUIS le détail : accepter la demande (Valider),
                Activer, Désactiver, Assigner… — plus besoin de repasser par le
                menu du listing (corrige l'aller-retour détail ↔ listing).
                Le menu porte son nom : il était entouré d'un cadre affichant le mot
                « Actions », soit un faux bouton dessiné autour d'un vrai. */}
            <TurboyActionMenu avecLibelle hideNavigation restaurants={restaurants} turboy={turboy} />
            {canDelete && (
              <Button onPress={() => setOpenDelete(true)} variant="danger-soft">
                <Trash2 aria-hidden="true" className="size-4" />
                Supprimer
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>

      {/*
       * Un segmente, et non des onglets. `Tabs.Indicator` — le trait qui marque l'onglet
       * actif — rend le `SharedElement` de react-aria, qui exige un conteneur d'animation
       * absent du projet et fait tomber la page. Sans lui, la barre d'onglets ne
       * distingue plus l'actif que par une nuance de gris.
       */}
      <ToggleButtonGroup
        className="flex-wrap"
        onSelectionChange={(sel) => {
          const v = Array.from(sel)[0];
          if (v) setOnglet(String(v));
        }}
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        <ToggleButton id="profil">Profil &amp; documents</ToggleButton>
        <ToggleButton id="habilitation">Habilitation &amp; pièces</ToggleButton>
        <ToggleButton id="activite">Activité &amp; pointages</ToggleButton>
      </ToggleButtonGroup>

      {/*
       * Les trois panneaux restent MONTES, seul l'affichage change : c'est ce que faisait
       * `destroyInactiveTabPanel={false}`. Les demonter ferait perdre la saisie du
       * formulaire et relancerait les lectures d'habilitation et de pointage a chaque
       * aller-retour.
       */}
      <div className="pt-6" hidden={onglet !== 'profil'}>
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
            <SectionDocumentsActuels
              avatarUrl={turboy.avatarUrl}
              cniUrlR={turboy.cniUrlR}
              cniUrlV={turboy.cniUrlV}
              vehiclePhotoUrl={turboy.vehiclePhotoUrl}
              contratUrl={turboy.contratUrl}
              ficheIdentificationUrl={turboy.ficheIdentificationUrl}
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

            {/*
             * `as={Link}` est une prop de la v2 : sur un Button v3 elle est ignoree EN
             * SILENCE et le bouton « Annuler » ne naviguait plus nulle part.
             */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <LienBouton href="/delivery-men/men" variante="outline">
                Annuler
              </LienBouton>
              <Button isPending={isSubmitting} type="submit" variant="primary">
                {isSubmitting ? <Spinner size="sm" /> : null}
                Enregistrer les modifications
              </Button>
            </div>
          </form>
      </div>

      <div className="pt-6" hidden={onglet !== 'habilitation'}>
          {/* M1 — validation, conformité des pièces, clé d'activation, historique */}
          <CompteHabilitationPanel driverId={id} />
      </div>

      <div className="pt-6" hidden={onglet !== 'activite'}>
          {/* M3 — cote de fiabilité, montée / relances / fin / hors-zone */}
          <PointagesSection driverId={id} />
      </div>

      {/* Suppression — réservée au DG, action irréversible */}
      <AlertDialog isOpen={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Supprimer le coursier</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-muted">
                  Êtes-vous sûr de vouloir supprimer définitivement{' '}
                  <strong className="text-foreground">
                    {turboy.prenoms} {turboy.nom}
                  </strong>{' '}
                  ? Cette action est irréversible.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={deleteMutation.isPending}
                  onPress={() => setOpenDelete(false)}
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button
                  isPending={deleteMutation.isPending}
                  onPress={() => deleteMutation.mutate(id)}
                  variant="danger"
                >
                  {deleteMutation.isPending ? <Spinner size="sm" /> : null}
                  {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
