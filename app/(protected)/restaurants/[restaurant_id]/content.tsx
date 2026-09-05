'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Card, Chip, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';

import { LienBouton } from '@/components/commons/LienBouton';
import { TitreSection } from '@/components/commons/TitreSection';
import {
  ChampListe,
  ChampMontant,
  ChampMotDePasse,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import { Input as AddressInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ExternalLink,
  FileImage,
  FileText,
  Map,
  PlugZap,
} from 'lucide-react';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, placeDetails } from '@/lib/googlemaps-server';
import {
  updateRestaurantSchema,
  type UpdateRestaurantDTO,
  METHOD_RECOUVREMENT_OPTIONS,
  TYPE_COMMISSION_OPTIONS,
} from '@/features/restaurants/schemas/update-restaurant.schema';
import { updateRestaurant } from '@/features/restaurants/actions/update-restaurant.action';
import { useInvalidateRestaurantsQuery, useToggleRestaurantMutation } from '@/features/restaurants/queries/restaurant-list.query';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { createUrlFile } from '@/utils/createUrlFile';
import IntegrationSection from './_sections/integration-section';
import GrilleTarifaireSection from './_sections/grille-tarifaire-section';
import AccesPartenaireSection from './_sections/acces-partenaire-section';

const ONGLETS = [
  { icone: Building2, id: 'profil', libelle: 'Profil' },
  { icone: CalendarClock, id: 'horaires', libelle: 'Horaires & documents' },
  { icone: Map, id: 'grille', libelle: 'Grille tarifaire' },
  { icone: PlugZap, id: 'integration', libelle: 'Intégration' },
] as const;

// ─── Document preview card ─────────────────────────────────────────────────────
function DocPreview({ label, url }: { label: string; url: string }) {
  const isPdf = /\.pdf(\?|$)/i.test(url);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <a href={url} target="_blank" rel="noreferrer" className="group relative block">
        {!isPdf && !imgError ? (
          <>
            <img
              src={url}
              alt={label}
              className="w-full h-28 object-cover rounded-lg border border-separator"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-separator bg-surface-secondary text-muted transition-colors hover:border-foreground hover:text-foreground">
            {isPdf ? <FileText className="w-8 h-8" /> : <FileImage className="w-8 h-8" />}
            <span className="text-[11px] font-medium text-center px-2 truncate w-full">
              {imgError ? 'Voir le document' : label}
            </span>
          </div>
        )}
      </a>
    </div>
  );
}

// ─── Onglet : libellé avec icône ───────────────────────────────────────────────
// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Content({ restaurant }: { restaurant: IRestaurant }) {
  const router = useRouter();
  const invalidateRestaurants = useInvalidateRestaurantsQuery();
  const toggleMutation = useToggleRestaurantMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localisationSuggestions, setLocalisationSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // Compte partenaire
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Statut actif/inactif (status > 0 = actif — même règle que la liste)
  const [isActive, setIsActive] = useState(() => (restaurant.status ?? 1) !== 0);
  const [onglet, setOnglet] = useState('profil');

  const handleLocalisationChange = useCallback(
    async (value: string) => {
      if (value.length > 2 && !loadingGeo) {
        try {
          setLocalisationSuggestions(await autocomplete(value));
        } catch {
          setLocalisationSuggestions([]);
        }
      } else {
        setLocalisationSuggestions([]);
      }
    },
    [loadingGeo],
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateRestaurantDTO>({
    resolver: zodResolver(updateRestaurantSchema),
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
      latitude: undefined,
      longitude: undefined,
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
        latitude: restaurant.latitude ?? undefined,
        longitude: restaurant.longitude ?? undefined,
      });
    }
  }, [restaurant, reset]);

  const typeCommission = watch('typeCommission');

  async function onSubmit(values: UpdateRestaurantDTO) {
    setIsSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    if (username) fd.append('username', username);
    if (password) fd.append('password', password);
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

  async function handleToggleStatus() {
    const newActive = !isActive;
    try {
      await toggleMutation.mutateAsync({ id: restaurant.id, activate: newActive });
      setIsActive(newActive);
      toast.success(newActive ? 'Partenaire activé' : 'Partenaire désactivé');
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  }

  const logoUrl = restaurant.logo_Url ? createUrlFile(restaurant.logo_Url, 'restaurant') : null;
  const docUrl = restaurant.documentUrl ? createUrlFile(restaurant.documentUrl, 'restaurant') : null;
  const cniUrl = restaurant.cni ? createUrlFile(restaurant.cni, 'restaurant') : null;
  const pictureUrls = restaurant.pictures?.slice(0, 4).map((p) => ({
    id: p.id,
    url: createUrlFile(p.pictureUrl, 'restaurant'),
  })) ?? [];
  const hasDocuments = logoUrl || docUrl || cniUrl || pictureUrls.length > 0;

  return (
    <div className="pb-16">
      {/* Back link */}
      <Link
        href="/restaurants"
        className="mb-4 flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour à la liste
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-foreground">Fiche partenaire</h1>
      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-sm text-muted capitalize truncate">{restaurant.nomEtablissement}</p>
        {/*
         * C'etait un `<button>` nu peint en SIX teintes de palette — vert au repos, rouge
         * au survol pour un actif, et l'inverse pour un inactif — qui changeait donc de
         * couleur SOUS le curseur : l'etat affiche devenait celui qu'on allait poser. On
         * lit l'etat, et le bouton dit ce qu'il fera.
         */}
        <div className="flex shrink-0 items-center gap-3">
          <Chip color={isActive ? 'success' : 'default'} size="sm" variant="soft">
            <Chip.Label>{isActive ? 'Actif' : 'Inactif'}</Chip.Label>
          </Chip>
          <Button
            isPending={toggleMutation.isPending}
            onPress={handleToggleStatus}
            size="sm"
            variant={isActive ? 'danger-soft' : 'outline'}
          >
            {isActive ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </div>

      {/*
       * `ToggleButtonGroup` et non `Tabs` : `Tabs.Indicator` de la v3 fait tomber la page,
       * et sans lui les onglets ne distinguent l'actif que par une nuance de gris. Quatre
       * options : la rangee tient sur une ligne, et enroule sur un telephone.
       */}
      <ToggleButtonGroup
        className="flex-wrap"
        onSelectionChange={(sel) => setOnglet(String(Array.from(sel)[0] ?? 'profil'))}
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        {ONGLETS.map((o) => (
          <ToggleButton id={o.id} key={o.id}>
            <o.icone aria-hidden="true" className="size-4" />
            {o.libelle}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <div className="pt-6" hidden={onglet !== 'profil'}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
            {/* ── Informations générales ── */}
            <Card>
              <Card.Content className="p-6">
              <TitreSection>Informations générales</TitreSection>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="nomEtablissement"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.nomEtablissement?.message}
                      label="Nom de l'établissement"
                      onChange={field.onChange}
                      placeholder="Mon Restaurant"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.email?.message}
                      label="Email"
                      onChange={field.onChange}
                      placeholder="restaurant@example.com" type="email"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="telephone"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.telephone?.message}
                      label="Téléphone"
                      onChange={field.onChange}
                      placeholder="+225 0000000000"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                <Controller
                  name="localisation"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="rest-localisation">Localisation</Label>
                      <div className="relative">
                        <AddressInput
                          {...field}
                          id="rest-localisation"
                          placeholder="Adresse complète"
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleLocalisationChange(e.target.value);
                          }}
                        />
                        {!loadingGeo && localisationSuggestions.length > 0 && (
                          <ul className="absolute z-50 w-full bg-surface border border-separator mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {localisationSuggestions.map((s) => (
                              <li
                                key={s.place_id}
                                className="px-4 py-2 hover:bg-surface-secondary cursor-pointer text-sm"
                                onMouseDown={async () => {
                                  field.onChange(s.description);
                                  setLocalisationSuggestions([]);
                                  setLoadingGeo(true);
                                  try {
                                    const details = await placeDetails(s.place_id);
                                    const lat = details.result.geometry?.location.lat ?? 0;
                                    const lng = details.result.geometry?.location.lng ?? 0;
                                    setValue('latitude', lat);
                                    setValue('longitude', lng);
                                  } catch {
                                    // fail silently
                                  } finally {
                                    setLoadingGeo(false);
                                  }
                                }}
                              >
                                {s.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {fieldState.invalid && (
                        <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                      )}
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="commune"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.commune?.message}
                      label="Commune"
                      onChange={field.onChange}
                      placeholder="Cocody"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="codePostal"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.codePostal?.message}
                      label="Code postal"
                      onChange={field.onChange}
                      placeholder="00225"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="siteWeb"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.siteWeb?.message}
                      label="Site web"
                      onChange={field.onChange}
                      placeholder="https://www.site.com"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="sm:col-span-2">
                      <ChampZoneTexte
                        erreur={errors.description?.message}
                        label="Description"
                        onChange={field.onChange}
                        placeholder="Décrivez votre établissement…"
                        valeur={field.value ?? ''}
                      />
                    </div>
                  )}
                />
              </div>
              </Card.Content>
            </Card>

            {/* ── Configuration financière ── */}
            <Card>
              <Card.Content className="p-6">
              <TitreSection>Configuration financière</TitreSection>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="typeCommission"
                  control={control}
                  render={({ field }) => (
                    <ChampListe
                      label="Type de commission"
                      onChange={field.onChange}
                      options={TYPE_COMMISSION_OPTIONS}
                      placeholder="Sélectionner un type"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
                {(typeCommission === 'POURCENTAGE' || typeCommission === 'FIXE') && (
                  <Controller
                    name="commission"
                    control={control}
                    render={({ field }) => (
                      <ChampMontant
                        label={
                          typeCommission === 'POURCENTAGE'
                            ? 'Commission (%)'
                            : 'Commission (montant fixe)'
                        }
                        max={typeCommission === 'POURCENTAGE' ? 100 : undefined}
                        onChange={field.onChange}
                        valeur={Number(field.value ?? 0)}
                      />
                    )}
                  />
                )}
                <Controller
                  name="methodRecouvrement"
                  control={control}
                  render={({ field }) => (
                    <ChampListe
                      label="Cycle de paiement"
                      onChange={field.onChange}
                      options={METHOD_RECOUVREMENT_OPTIONS}
                      placeholder="Sélectionner une période"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
              </div>
              </Card.Content>
            </Card>

            {/* ── Compte du partenaire ── */}
            <Card>
              <Card.Content className="p-6">
              <TitreSection>Compte du partenaire</TitreSection>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChampTexte
                  label="Nom utilisateur"
                  onChange={setUsername}
                  placeholder="username_restaurant"
                  valeur={username}
                />
                <ChampMotDePasse
                  label="Nouveau mot de passe"
                  onChange={setPassword}
                  valeur={password}
                />
              </div>
              </Card.Content>
            </Card>

            {/* ── Footer actions ── */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */}
              <LienBouton href="/restaurants" variante="ghost">
                Annuler
              </LienBouton>
              <Button isPending={isSubmitting} type="submit" variant="primary">
                Enregistrer les modifications
              </Button>
            </div>
          </form>
      </div>

      {/* ── Horaires & documents ── */}
      <div className="pt-6" hidden={onglet !== 'horaires'}>
          <div className="flex flex-col gap-8">
            <Card>
              <Card.Content className="p-6">
              <TitreSection>Horaires d&apos;ouverture</TitreSection>
              {(() => {
                const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
                const LABELS: Record<string, string> = { LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche' };
                const hours = restaurant.openingHours ?? [];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {JOURS.map((jour) => {
                      const h = hours.find((x) => x.dayOfWeek === jour);
                      return (
                        <div
                          key={jour}
                          /*
                           * Un jour OUVERT etait peint en `bg-green-50 border-green-100` :
                           * du vert de palette, sans variante sombre, pour dire l'etat
                           * ordinaire d'un restaurant. Ce qui se distingue vraiment ici,
                           * c'est le jour FERME ou NON DEFINI — et la pastille le dit.
                           */
                          className="flex items-center justify-between gap-2 rounded-lg border border-separator bg-surface-secondary px-4 py-2.5 text-sm"
                        >
                          <span className="w-24 font-medium text-foreground">{LABELS[jour]}</span>
                          {!h ? (
                            <Chip size="sm" variant="soft">
                              <Chip.Label>Non défini</Chip.Label>
                            </Chip>
                          ) : h.closed ? (
                            <Chip size="sm" variant="soft">
                              <Chip.Label>Fermé</Chip.Label>
                            </Chip>
                          ) : (
                            <Chip color="success" size="sm" variant="soft">
                              <Chip.Label className="tabular-nums">
                                {h.openingTime?.slice(0, 5)} – {h.closingTime?.slice(0, 5)}
                              </Chip.Label>
                            </Chip>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6">
              <TitreSection>Documents</TitreSection>
              {hasDocuments ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {logoUrl && <DocPreview label="Logo" url={logoUrl} />}
                  {cniUrl && <DocPreview label="CNI propriétaire" url={cniUrl} />}
                  {docUrl && <DocPreview label="Document légal" url={docUrl} />}
                  {pictureUrls.map((p, i) => (
                    <DocPreview key={p.id} label={`Photo ${i + 1}`} url={p.url} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted border border-dashed border-separator rounded-lg p-6 text-center">
                  Aucun document fourni pour ce partenaire.
                </div>
              )}
              </Card.Content>
            </Card>
          </div>
      </div>

      {/* ── Grille tarifaire ── */}
      <div className="pt-6" hidden={onglet !== 'grille'}>
        <GrilleTarifaireSection restaurantId={restaurant.id} />
      </div>

      {/* ── Intégration ── */}
      <div className="flex flex-col gap-8 pt-6" hidden={onglet !== 'integration'}>
        <IntegrationSection restaurantId={restaurant.id} />
        <AccesPartenaireSection restaurantId={restaurant.id} />
      </div>
    </div>
  );
}
