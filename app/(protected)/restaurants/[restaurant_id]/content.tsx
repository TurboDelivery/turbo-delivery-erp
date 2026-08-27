'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Input, Select, SelectItem, Tab, Tabs, Textarea } from '@heroui/react';
import { Input as AddressInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ExternalLink,
  Eye,
  EyeOff,
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

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

// ─── Document preview card ─────────────────────────────────────────────────────
function DocPreview({ label, url }: { label: string; url: string }) {
  const isPdf = /\.pdf(\?|$)/i.test(url);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <a href={url} target="_blank" rel="noreferrer" className="group relative block">
        {!isPdf && !imgError ? (
          <>
            <img
              src={url}
              alt={label}
              className="w-full h-28 object-cover rounded-lg border border-gray-200"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-primary hover:bg-primary/5 transition-colors text-gray-500 hover:text-primary">
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
function TabTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {icon}
      <span>{children}</span>
    </div>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

  // Statut actif/inactif (status > 0 = actif — même règle que la liste)
  const [isActive, setIsActive] = useState(() => (restaurant.status ?? 1) !== 0);

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
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-1">Fiche partenaire</h1>
      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500 capitalize truncate">{restaurant.nomEtablissement}</p>
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={toggleMutation.isPending}
          className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
            isActive
              ? 'border-green-500 bg-green-50 text-green-700 hover:bg-red-50 hover:border-red-400 hover:text-red-600'
              : 'border-red-400 bg-red-50 text-red-600 hover:bg-green-50 hover:border-green-500 hover:text-green-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
          {toggleMutation.isPending ? 'En cours...' : isActive ? 'ACTIF' : 'INACTIF'}
        </button>
      </div>

      <Tabs
        aria-label="Sections de la fiche partenaire"
        variant="underlined"
        color="primary"
        destroyInactiveTabPanel={false}
        classNames={{
          base: 'w-full',
          tabList: 'w-full gap-6 rounded-none p-0 border-b border-gray-200 overflow-x-auto',
          tab: 'max-w-fit px-0 h-11',
          tabContent: 'text-sm font-medium',
          panel: 'px-0 pt-6',
        }}
      >
        {/* ── Profil (formulaire d'édition) ── */}
        <Tab key="profil" title={<TabTitle icon={<Building2 className="w-4 h-4" />}>Profil</TabTitle>}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
            {/* ── Informations générales ── */}
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <SectionTitle>Informations générales</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="nomEtablissement"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} label="Nom de l'établissement" placeholder="Mon Restaurant" isInvalid={!!errors.nomEtablissement} errorMessage={errors.nomEtablissement?.message} variant="bordered" />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} type="email" label="Email" placeholder="restaurant@example.com" isInvalid={!!errors.email} errorMessage={errors.email?.message} variant="bordered" />
                  )}
                />
                <Controller
                  name="telephone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} label="Téléphone" placeholder="+225 0000000000" isInvalid={!!errors.telephone} errorMessage={errors.telephone?.message} variant="bordered" />
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
                          <ul className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {localisationSuggestions.map((s) => (
                              <li
                                key={s.place_id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                    <Input {...field} label="Site web" placeholder="https://www.site.com" isInvalid={!!errors.siteWeb} errorMessage={errors.siteWeb?.message} variant="bordered" className="sm:col-span-2" />
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

            {/* ── Configuration financière ── */}
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <SectionTitle>Configuration financière</SectionTitle>
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

            {/* ── Compte du partenaire ── */}
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <SectionTitle>Compte du partenaire</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom utilisateur"
                  variant="bordered"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username_restaurant"
                />
                <Input
                  label="Nouveau mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  variant="bordered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  endContent={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
            </section>

            {/* ── Footer actions ── */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="flat" as={Link} href="/restaurants">
                Annuler
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Tab>

        {/* ── Horaires & documents ── */}
        <Tab key="horaires" title={<TabTitle icon={<CalendarClock className="w-4 h-4" />}>Horaires &amp; documents</TabTitle>}>
          <div className="flex flex-col gap-8">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <SectionTitle>Horaires d&apos;ouverture</SectionTitle>
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
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm border ${
                            !h ? 'bg-gray-50 border-gray-100 text-gray-400'
                              : h.closed ? 'bg-gray-50 border-gray-100 text-gray-400'
                              : 'bg-green-50 border-green-100 text-gray-700'
                          }`}
                        >
                          <span className="font-medium w-24">{LABELS[jour]}</span>
                          {!h ? (
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Non défini</span>
                          ) : h.closed ? (
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Fermé</span>
                          ) : (
                            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              {h.openingTime?.slice(0, 5)} – {h.closingTime?.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <SectionTitle>Documents</SectionTitle>
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
                <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                  Aucun document fourni pour ce partenaire.
                </div>
              )}
            </section>
          </div>
        </Tab>

        {/* ── Grille tarifaire ── */}
        <Tab key="grille" title={<TabTitle icon={<Map className="w-4 h-4" />}>Grille tarifaire</TabTitle>}>
          <GrilleTarifaireSection restaurantId={restaurant.id} />
        </Tab>

        {/* ── Intégration ── */}
        <Tab key="integration" title={<TabTitle icon={<PlugZap className="w-4 h-4" />}>Intégration</TabTitle>}>
          <div className="flex flex-col gap-8">
            <IntegrationSection restaurantId={restaurant.id} />
            <AccesPartenaireSection restaurantId={restaurant.id} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
