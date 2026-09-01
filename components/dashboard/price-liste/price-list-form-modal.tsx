'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, calculateDistance, geocodeAddressServer, placeDetails } from '@/lib/googlemaps-server';
import { DeliveryFee } from '@/types/price-list';
import { priceListSchema, PriceListFormData } from '@/features/price-list/schemas/price-list.schema';
import { useCreateDeliveryFeeMutation, useUpdatePriceListMutation } from '@/features/price-list/queries/price-list.mutation';
import { useQuery } from '@tanstack/react-query';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import EtatErreur from '@/components/commons/EtatErreur';
import { cn } from '@/lib/utils';

type LatLng = { lat: number; lng: number };

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: DeliveryFee | null;
}

export default function PriceListFormModal({ open, onClose, mode, initialData }: Props) {
  const createMutation = useCreateDeliveryFeeMutation();
  const updateMutation = useUpdatePriceListMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const isEdit = mode === 'edit';

  // getAllRestaurants relance desormais. Le tableau vide rendait le formulaire menteur:
  // en creation le selecteur de restaurant n'avait aucune option donc rien n'etait
  // enregistrable, et en modification typeCommission restait nul, ce qui faisait
  // disparaitre les champs Commission et Seuil comme s'ils n'existaient pas.
  const {
    data: allRestaurants = [],
    isError: isRestaurantsError,
    isFetching: isRestaurantsFetching,
    refetch: refetchRestaurants,
  } = useQuery({
    queryKey: ['restaurants', 'all'],
    queryFn: () => getAllRestaurants(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: buildDefaults(initialData),
  });

  const { control, handleSubmit, setValue, reset, watch } = form;

  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(initialData));
    setSuggestions([]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedRestaurantId = watch('restaurantId');
  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');
  const currentRestaurant = allRestaurants.find((r) => r.id === watchedRestaurantId);
  const typeCommission = currentRestaurant?.typeCommission ?? null;
  // Coordinates can live at root level or inside `position` depending on the restaurant
  const restaurantLat = currentRestaurant?.latitude ?? currentRestaurant?.position?.latitude ?? 0;
  const restaurantLng = currentRestaurant?.longitude ?? currentRestaurant?.position?.longitude ?? 0;
  const restaurantHasCoords = !!restaurantLat && !!restaurantLng;
  const restaurantPoint: LatLng = { lat: restaurantLat, lng: restaurantLng };

  const commissionLabel = typeCommission === 'POURCENTAGE' ? 'Commission (%)' : 'Commission (XOF)';

  // Recalculate distance when restaurant changes after zone is already selected
  useEffect(() => {
    if (isEdit) return;
    if (!watchedLat || !watchedLng) return;
    const getOrigin = async (): Promise<LatLng | null> => {
      if (restaurantHasCoords) return restaurantPoint;
      if (currentRestaurant?.localisation) return geocodeAddressServer(currentRestaurant.localisation);
      return null;
    };
    getOrigin()
      .then((origin) => origin && calculateDistance(origin, { lat: watchedLat, lng: watchedLng }))
      .then((distance) => { if (distance) setValue('distanceFin', distance); })
      .catch(() => {});
  }, [watchedRestaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneChange = useCallback(
    async (value: string) => {
      if (value.length > 2 && !loadingGeo) {
        try {
          setSuggestions(await autocomplete(value));
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    },
    [loadingGeo],
  );

  const handleSuggestionClick = async (suggestion: PlaceAutocompleteResult) => {
    setLoadingGeo(true);
    setValue('zone', suggestion.description, { shouldValidate: true });
    setSuggestions([]);
    try {
      const details = await placeDetails(suggestion.place_id);
      const lat = details.result.geometry?.location.lat ?? 0;
      const lng = details.result.geometry?.location.lng ?? 0;
      setValue('latitude', lat);
      setValue('longitude', lng);
      let origin = restaurantHasCoords ? restaurantPoint : null;
      if (!origin && currentRestaurant?.localisation) {
        origin = await geocodeAddressServer(currentRestaurant.localisation);
      }
      if (origin) {
        const distance = await calculateDistance(origin, { lat, lng });
        setValue('distanceFin', distance ?? 0);
      }
    } catch {
      // fail silently — user can enter distance manually
    } finally {
      setLoadingGeo(false);
    }
  };

  const onSubmit = (data: PriceListFormData) => {
    if (isEdit) {
      updateMutation.mutate(data, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  const onError = (errors: Record<string, unknown>) => {
    console.error('Validation errors:', errors);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier un frais de livraison' : 'Ajouter un frais de livraison'}
          </DialogTitle>
        </DialogHeader>

        {/* On remplace le formulaire entier plutot que le seul selecteur: sans la liste
            des restaurants, les champs restants sont muets ou absents et une saisie
            terminee ne pourrait pas etre enregistree. */}
        {isRestaurantsError ? (
          <EtatErreur
            quoi="la liste des restaurants"
            onReessayer={() => refetchRestaurants()}
            enCours={isRestaurantsFetching}
          />
        ) : (
        <form id="price-list-form" onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col gap-4 pt-2">

          {/* Row 1 : nom + restaurant (create) | nom seul (edit) */}
          <div className={cn(isEdit ? '' : 'grid grid-cols-2 gap-3')}>

            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label htmlFor="pl-name">Nom <span className="text-destructive">*</span></Label>
                  <Input
                    {...field}
                    id="pl-name"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                  )}
                </div>
              )}
            />


            {!isEdit && (
              <Controller
                name="restaurantId"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label>Restaurant <span className="text-destructive">*</span></Label>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={cn(
                        'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs',
                        fieldState.invalid && 'border-destructive',
                      )}
                    >
                      <option value="">Sélectionner un restaurant</option>
                      {allRestaurants
                        .slice()
                        .sort((a, b) => a.nomEtablissement.localeCompare(b.nomEtablissement))
                        .map((r) => (
                          <option key={r.id} value={r.id}>{r.nomEtablissement}</option>
                        ))}
                    </select>
                    {fieldState.invalid && (
                      <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                    )}
                  </div>
                )}
              />
            )}
            {isEdit && (
              <Controller
                name="restaurantId"
                control={control}
                render={({ field }) => <input type="hidden" {...field} />}
              />
            )}
          </div>

          {/* Zone avec autocomplete Google Maps */}
          <Controller
            name="zone"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                <Label htmlFor="pl-zone">Zone <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    {...field}
                    id="pl-zone"
                    placeholder="Entrez une adresse"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleZoneChange(e.target.value);
                    }}
                  />
                  {!loadingGeo && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((s) => (
                        <li
                          key={s.place_id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleSuggestionClick(s)}
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

          {/* Champs cachés */}
          <Controller control={control} name="latitude" render={({ field }) => <input type="hidden" {...field} />} />
          <Controller control={control} name="longitude" render={({ field }) => <input type="hidden" {...field} />} />
          <Controller control={control} name="distanceDebut" render={({ field }) => <input type="hidden" {...field} />} />

          {/* Row 2 : distanceFin + prix */}
          <div className="grid grid-cols-2 gap-3">

            <Controller
              name="distanceFin"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label htmlFor="pl-distance">Distance (km) <span className="text-destructive">*</span></Label>
                  <Input
                    {...field}
                    id="pl-distance"
                    type="number"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="prix"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label htmlFor="pl-prix">Prix (XOF) <span className="text-destructive">*</span></Label>
                  <Input
                    {...field}
                    id="pl-prix"
                    type="number"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Commission + Seuil — visible uniquement si typeCommission défini.
              Le seuil d'application n'est pertinent que pour le montant fixe (SPEC « Seuil »). */}
          {typeCommission && (
            <div className={cn(typeCommission === 'FIXE' ? 'grid grid-cols-2 gap-3' : '')}>
              <Controller
                name="commission"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label htmlFor="pl-commission">{commissionLabel} <span className="text-destructive">*</span></Label>
                    <Input
                      {...field}
                      id="pl-commission"
                      type="number"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                    )}
                  </div>
                )}
              />

              {typeCommission === 'FIXE' && (
                <Controller
                  name="seuilCommission"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label htmlFor="pl-seuil">Seuil d&apos;application (XOF)</Label>
                      <Input
                        {...field}
                        value={field.value ?? 0}
                        id="pl-seuil"
                        type="number"
                        min={0}
                        step={1}
                        aria-invalid={fieldState.invalid}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Laisser à 0 pour appliquer la commission à toutes les commandes.
                      </p>
                      {fieldState.invalid && (
                        <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                      )}
                    </div>
                  )}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : <><Save size={16} className="mr-1.5" />{isEdit ? 'Modifier' : 'Ajouter'}</>}
            </Button>
          </div>

        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function buildDefaults(initialData?: DeliveryFee | null): PriceListFormData {
  return {
    id: initialData?.id ?? '',
    name: initialData?.name ?? '',
    restaurantId: initialData?.restaurantId ?? '',
    zone: initialData?.zone ?? '',
    latitude: initialData?.latitude ?? 0,
    longitude: initialData?.longitude ?? 0,
    distanceDebut: initialData?.distanceDebut ?? 0,
    distanceFin: initialData?.distanceFin ?? 0,
    prix: initialData?.prix ?? 0,
    commission: initialData?.commission ?? 0,
    seuilCommission: initialData?.seuilCommission ?? 0,
  };
}
