'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, calculateDistance, placeDetails } from '@/lib/googlemaps-server';
import { DeliveryFee } from '@/types/price-list';
import { priceListSchema, PriceListFormData } from '@/features/price-list/schemas/price-list.schema';
import { createDeliveryFee, updatePriceList } from '@/src/price-list/price-list.action';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { cn } from '@/lib/utils';

type LatLng = { lat: number; lng: number };

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: DeliveryFee | null;
}

export default function PriceListFormModal({ open, onClose, mode, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const isEdit = mode === 'edit';

  const { data: allRestaurants = [] } = useDefinedRestaurantsQuery();

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
  const currentRestaurant = allRestaurants.find((r) => r.id === watchedRestaurantId);
  const typeCommission = currentRestaurant?.typeCommission ?? null;
  const restaurantPoint: LatLng = {
    lat: currentRestaurant?.latitude ?? 0,
    lng: currentRestaurant?.longitude ?? 0,
  };

  const commissionLabel = typeCommission === 'POURCENTAGE' ? 'Commission (%)' : 'Commission (XOF)';

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
      const distance = await calculateDistance(restaurantPoint, { lat, lng });
      setValue('distanceFin', distance ?? 0);
    } catch {
      // fail silently — user can enter distance manually
    } finally {
      setLoadingGeo(false);
    }
  };

  const onSubmit = (data: PriceListFormData) => {
    startTransition(async () => {
      try {
        // updatePriceList signature is typed without id but accepts it at runtime
        const result = isEdit
          ? await (updatePriceList as (d: PriceListFormData) => ReturnType<typeof updatePriceList>)(data)
          : await createDeliveryFee(data);

        if (result.status === 'success') {
          toast.success(result.message || 'Opération réussie');
          router.refresh();
          onClose();
        } else {
          toast.error(result.message || 'Une erreur est survenue');
        }
      } catch {
        toast.error('Une erreur est survenue');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier un frais de livraison' : 'Ajouter un frais de livraison'}
          </DialogTitle>
        </DialogHeader>

        <form id="price-list-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">

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
                    <RestaurantSelect
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? '')}
                    />
                    {fieldState.invalid && (
                      <p className="text-xs text-destructive">{fieldState.error?.message}</p>
                    )}
                  </div>
                )}
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

          {/* Commission — visible uniquement si typeCommission défini */}
          {typeCommission && (
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
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" form="price-list-form" disabled={isPending}>
              {isPending ? 'Enregistrement…' : <><Save size={16} className="mr-1.5" />{isEdit ? 'Modifier' : 'Ajouter'}</>}
            </Button>
          </div>

        </form>
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
  };
}
