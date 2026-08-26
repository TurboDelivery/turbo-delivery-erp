'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import {
  createRestaurantSchema,
  type CreateRestaurantDTO,
} from '@/features/restaurants/schemas/create-restaurant.schema';
import { createRestaurant } from '@/features/restaurants/actions/create-restaurant.action';
import { compresserImage, compresserImages } from '@/lib/compresser-image';
import { CoverLogoSection } from './_sections/CoverLogoSection';
import { InfoGeneralesSection } from './_sections/InfoGeneralesSection';
import { CommissionSection } from './_sections/CommissionSection';
import { ComptePartenaireSection } from './_sections/ComptePartenaireSection';
import { PhotosSection } from './_sections/PhotosSection';
import { HorairesSection, type Horaire } from './_sections/HorairesSection';
import { AutresDocumentsSection } from './_sections/AutresDocumentsSection';
import { DocumentsPartenaireSection } from './_sections/DocumentsPartenaireSection';

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;

/**
 * Le serveur refuse l'envoi au-delà de 10 Mo pour l'ensemble des fichiers d'une même requête
 * — mesuré en production : 11,6 Mo rejetés, 8,7 Mo acceptés. On s'arrête un peu avant, les
 * champs texte du formulaire comptant eux aussi dans le total.
 */
const POIDS_TOTAL_MAX = 9 * 1024 * 1024;

function enMegaoctets(octets: number): string {
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Mesure volontairement plus etroite que le conteneur de page.
 *
 * C'est le seul endroit de l'ERP ou l'ecart est justifie : les champs de ce
 * formulaire sont en colonne unique, et une saisie de 1280px de large oblige
 * l'oeil a traverser tout l'ecran entre l'etiquette et la valeur. La contrainte
 * porte sur le FORMULAIRE, pas sur la page.
 */
export default function CreateContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);
  const autreDocRef = useRef<HTMLInputElement>(null);

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [picturePreviews, setPicturePreviews] = useState<string[]>([]);

  // Other states
  const [contacts, setContacts] = useState<{ nom: string; telephone: string }[]>([{ nom: '', telephone: '' }]);
  const [autreDocType, setAutreDocType] = useState('contrat');
  const [autreDocFile, setAutreDocFile] = useState<File | null>(null);

  // Documents partenariat
  const [fichePartnerFile, setFichePartnerFile] = useState<File | null>(null);
  const [contratPartnerFile, setContratPartnerFile] = useState<File | null>(null);
  const [avenantFile, setAvenantFile] = useState<File | null>(null);

  // Compte partenaire
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [horaires, setHoraires] = useState<Horaire[]>(
    JOURS.map((j) => ({ jour: j, ouverture: '08:00', fermeture: '22:00', ferme: false }))
  );

  // Form
  const methods = useForm<CreateRestaurantDTO>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      nomEtablissement: '', description: '', email: '', telephone: '',
      codePostal: '', commune: '', localisation: '', siteWeb: '',
      typeCommission: '', commission: 0, methodRecouvrement: undefined,
      latitude: undefined, longitude: undefined,
    },
  });
  const { control, handleSubmit, watch, formState: { errors } } = methods;
  const typeCommission = watch('typeCommission');

  // Handlers
  //
  // Les images sont réduites dès la sélection, jamais au moment de l'envoi : l'utilisateur
  // voit tout de suite l'aperçu de ce qui partira, et le poids total affiché plus bas est
  // celui des fichiers réellement transmis.
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
  function removeNewPicture(index: number) {
    const next = pictureFiles.filter((_, i) => i !== index);
    setPictureFiles(next);
    setPicturePreviews(next.map((f) => URL.createObjectURL(f)));
  }
  function updateHoraire(index: number, key: keyof Horaire, value: string | boolean) {
    setHoraires((prev) => prev.map((h, i) => i === index ? { ...h, [key]: value } : h));
  }

  async function onSubmit(values: CreateRestaurantDTO) {
    if (!logoFile) {
      toast.error('Le logo du restaurant est requis');
      return;
    }

    // Les images sont déjà réduites ; il reste les PDF (contrat, fiche, avenant), qu'on ne
    // peut pas alléger. Mieux vaut le dire ici, formulaire intact, que laisser le serveur
    // rejeter l'envoi après coup avec un message anglais.
    const fichiers = [logoFile, coverFile, ...pictureFiles, autreDocFile,
                      fichePartnerFile, contratPartnerFile, avenantFile]
      .filter((f): f is File => f instanceof File);
    const poidsTotal = fichiers.reduce((somme, f) => somme + f.size, 0);
    if (poidsTotal > POIDS_TOTAL_MAX) {
      const plusLourd = fichiers.reduce((a, b) => (a.size >= b.size ? a : b));
      toast.error(
        `Pièces jointes trop lourdes : ${enMegaoctets(poidsTotal)} au total, maximum ${enMegaoctets(POIDS_TOTAL_MAX)}. `
        + `Le plus lourd est « ${plusLourd.name} » (${enMegaoctets(plusLourd.size)}) — retirez-le ou remplacez-le par un fichier plus léger.`,
      );
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();

    // Champs texte
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
    });

    // Fichiers
    if (logoFile) fd.append('logo', logoFile);
    if (coverFile) fd.append('coverImage', coverFile);
    pictureFiles.forEach((f) => fd.append('pictures', f));
    if (autreDocFile) { fd.append('document', autreDocFile); fd.append('documentType', autreDocType); }

    // Documents partenariat
    if (fichePartnerFile) fd.append('ficheRenseignement', fichePartnerFile);
    if (contratPartnerFile) fd.append('contratPartenariat', contratPartnerFile);
    if (avenantFile) fd.append('avenantContrat', avenantFile);

    // Compte partenaire
    if (username) fd.append('username', username);
    if (password) fd.append('password', password);

    // Contacts
    contacts.forEach((c, i) => {
      if (c.nom) fd.append(`contact_nom_${i}`, c.nom);
      if (c.telephone) fd.append(`contact_telephone_${i}`, c.telephone);
    });

    // Horaires
    horaires.forEach((h, i) => {
      fd.append(`openingHours[${i}][dayOfWeek]`, h.jour);
      fd.append(`openingHours[${i}][openingTime]`, h.ouverture);
      fd.append(`openingHours[${i}][closingTime]`, h.fermeture);
      fd.append(`openingHours[${i}][closed]`, String(h.ferme));
    });

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
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/restaurants" className="text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-xl font-bold text-primary">Créer un restaurant</span>
      </div>

      <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

        <CoverLogoSection
          logoRef={logoRef}
          coverRef={coverRef}
          logoPreview={logoPreview}
          coverPreview={coverPreview}
          onLogoChange={handleLogoChange}
          onCoverChange={handleCoverChange}
        />
        <div className="mt-10" />

        <InfoGeneralesSection
          control={control}
          errors={errors}
          contacts={contacts}
          setContacts={setContacts}
        />

        <CommissionSection
          control={control}
          typeCommission={typeCommission ?? ''}
        />

        <ComptePartenaireSection
          username={username}
          password={password}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
        />

        <DocumentsPartenaireSection
          ficheFile={fichePartnerFile}
          contratFile={contratPartnerFile}
          avenantFile={avenantFile}
          onFicheChange={setFichePartnerFile}
          onContratChange={setContratPartnerFile}
          onAvenantChange={setAvenantFile}
        />

        <PhotosSection
          pictureRef={pictureRef}
          picturePreviews={picturePreviews}
          onPicturesChange={handlePicturesChange}
          onRemove={removeNewPicture}
        />

        <HorairesSection
          horaires={horaires}
          onUpdate={updateHoraire}
        />

        <AutresDocumentsSection
          autreDocRef={autreDocRef}
          autreDocType={autreDocType}
          autreDocFile={autreDocFile}
          onTypeChange={setAutreDocType}
          onFileChange={setAutreDocFile}
        />

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 z-10">
          <Button type="button" variant="flat" as={Link} href="/restaurants">Annuler</Button>
          <Button type="submit" color="primary" isLoading={isSubmitting}>Enregistrer</Button>
        </div>
      </form>
      </FormProvider>
    </div>
  );
}
