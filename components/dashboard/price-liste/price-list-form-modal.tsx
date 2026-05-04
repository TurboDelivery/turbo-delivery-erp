'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, Input, Select, SelectItem } from '@heroui/react';
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

type LatLng = { lat: number; lng: number };

export type RestaurantOption = {
  id: string;
  nomEtablissement: string;
  latitude: number;
  longitude: number;
  typeCommission: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: DeliveryFee | null;
  restaurants: RestaurantOption[];
}

export default function PriceListFormModal({ open, onClose, mode, initialData, restaurants }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [distanceDisplay, setDistanceDisplay] = useState(initialData?.distanceFin ?? 0);
  const [restaurantPoint, setRestaurantPoint] = useState<LatLng>({ lat: 0, lng: 0 });
  const [typeCommission, setTypeCommission] = useState<string | null>(null);

  const isEdit = mode === 'edit';

  const { control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(initialData));
    setDistanceDisplay(initialData?.distanceFin ?? 0);
    setSuggestions([]);
    const rid = initialData?.restaurantId;
    if (rid) {
      const r = restaurants.find((x) => x.id === rid);
      if (r) {
        setRestaurantPoint({ lat: r.latitude, lng: r.longitude });
        setTypeCommission(r.typeCommission);
      }
    } else {
      setRestaurantPoint({ lat: 0, lng: 0 });
      setTypeCommission(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedRestaurantId = watch('restaurantId');

  useEffect(() => {
    if (!watchedRestaurantId) return;
    const r = restaurants.find((x) => x.id === watchedRestaurantId);
    if (r) {
      setRestaurantPoint({ lat: r.latitude, lng: r.longitude });
      setTypeCommission(r.typeCommission);
    }
  }, [watchedRestaurantId, restaurants]);

  const handleInputChange = useCallback(
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
      setDistanceDisplay(distance ?? 0);
    } catch {
      // fail silently, user can enter distance manually
    } finally {
      setLoadingGeo(false);
    }
  };

  const onSubmit = (data: PriceListFormData) => {
    startTransition(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = isEdit
          ? await (updatePriceList as any)(data)
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

  const commissionLabel =
    typeCommission === 'POURCENTAGE' ? 'Commission (%)' : typeCommission === 'FIXE' ? 'Commission (XOF)' : 'Commission';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier un frais de livraison' : 'Ajouter un frais de livraison'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          {/* Row 1 : name + restaurant select (create) ou name seul (edit) */}
          <div className={isEdit ? '' : 'grid grid-cols-2 gap-3'}>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  {...field}
                  label="Nom"
                  variant="bordered"
                  radius="sm"
                  isRequired
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />
            {!isEdit && (
              <Controller
                control={control}
                name="restaurantId"
                render={({ field }) => (
                  <Select
                    label="Restaurant"
                    variant="bordered"
                    radius="sm"
                    isRequired
                    isInvalid={!!errors.restaurantId}
                    errorMessage={errors.restaurantId?.message}
                    selectedKeys={field.value ? [field.value] : []}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {restaurants
                      .filter((r) => r.typeCommission)
                      .map((r) => (
                        <SelectItem key={r.id}>{r.nomEtablissement}</SelectItem>
                      ))}
                  </Select>
                )}
              />
            )}
          </div>

          {/* Zone avec autocomplete Google Maps */}
          <Controller
            control={control}
            name="zone"
            render={({ field }) => (
              <div className="relative">
                <Input
                  {...field}
                  label="Zone"
                  placeholder="Entrez une adresse"
                  variant="bordered"
                  radius="sm"
                  isRequired
                  isInvalid={!!errors.zone}
                  errorMessage={errors.zone?.message}
                  onValueChange={(v) => {
                    field.onChange(v);
                    handleInputChange(v);
                  }}
                />
                {!loadingGeo && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg">
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
            )}
          />

          {/* Champs cachés */}
          <Controller control={control} name="latitude" render={({ field }) => <input type="hidden" {...field} />} />
          <Controller control={control} name="longitude" render={({ field }) => <input type="hidden" {...field} />} />
          <Controller control={control} name="distanceDebut" render={({ field }) => <input type="hidden" {...field} />} />

          {/* Row 2 : distanceFin + prix */}
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="distanceFin"
              render={({ field }) => (
                <Input
                  {...field}
                  value={distanceDisplay.toString()}
                  label="Distance (km)"
                  type="number"
                  variant="bordered"
                  radius="sm"
                  isRequired
                  isInvalid={!!errors.distanceFin}
                  errorMessage={errors.distanceFin?.message}
                  onValueChange={(v) => {
                    const n = Number(v);
                    field.onChange(n);
                    setDistanceDisplay(n);
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="prix"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value.toString()}
                  label="Prix (XOF)"
                  type="number"
                  variant="bordered"
                  radius="sm"
                  isRequired
                  isInvalid={!!errors.prix}
                  errorMessage={errors.prix?.message}
                  onValueChange={(v) => field.onChange(Number(v))}
                />
              )}
            />
          </div>

          {/* Commission — conditionnel */}
          {typeCommission && (
            <Controller
              control={control}
              name="commission"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value.toString()}
                  label={commissionLabel}
                  type="number"
                  variant="bordered"
                  radius="sm"
                  isRequired
                  isInvalid={!!errors.commission}
                  errorMessage={errors.commission?.message}
                  onValueChange={(v) => field.onChange(Number(v))}
                />
              )}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="bordered" type="button" onPress={onClose} isDisabled={isPending}>
              Annuler
            </Button>
            <Button color="danger" type="submit" isLoading={isPending} startContent={!isPending && <Save size={18} />}>
              {isEdit ? 'Modifier' : 'Ajouter'}
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
