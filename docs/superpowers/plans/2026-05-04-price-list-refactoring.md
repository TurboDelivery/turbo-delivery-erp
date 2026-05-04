# Price List Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Séparer les colonnes dans un fichier dédié, déplacer le hook dans `features/`, et remplacer les deux formes (Popover create dans `header.tsx` + Popover edit `FormUpDate.tsx`) par un seul composant modal `PriceListFormModal`.

**Architecture:** Le modal unique gère les deux cas (create/edit) via un prop `mode`. La logique de la table migre de `app/(protected)/price-list/usePriceLiceDefined.tsx` vers `features/price-list/hooks/use-price-list-table.ts`. Les colonnes HeroUI et le `renderCell` vont dans `components/dashboard/price-liste/price-list-columns.tsx`.

**Tech Stack:** Next.js App Router, HeroUI, Shadcn (`Dialog`), React Hook Form, Zod, Google Maps (autocomplete / distance), server actions existants.

---

## File Map

| Action | Chemin |
|--------|--------|
| Create | `features/price-list/schemas/price-list.schema.ts` |
| Create | `features/price-list/hooks/use-price-list-table.ts` |
| Create | `components/dashboard/price-liste/price-list-columns.tsx` |
| Create | `components/dashboard/price-liste/price-list-form-modal.tsx` |
| Modify | `components/dashboard/price-liste/header.tsx` |
| Modify | `app/(protected)/price-list/content.tsx` |
| Delete | `components/dashboard/price-liste/FormUpDate.tsx` |
| Simplify | `app/(protected)/price-list/usePriceLiceDefined.tsx` |

---

## Task 1 — Schéma Zod unifié

**Files:**
- Create: `features/price-list/schemas/price-list.schema.ts`

### Contexte
Les deux schémas existants (`deliveryFeeCreateSchema` et `deliveryFeeUpdateSchema` dans `src/price-list/price-list.schema.ts`) sont quasi-identiques. On crée un schéma unique dont `id` est optionnel — absent = create, présent = edit.

- [ ] **Créer le fichier de schéma unifié**

```typescript
// features/price-list/schemas/price-list.schema.ts
import { z } from 'zod';

export const priceListSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Le nom est obligatoire'),
  restaurantId: z.string().min(1, 'Le restaurant est requis'),
  zone: z.string().min(1, 'La zone est requise'),
  latitude: z.number(),
  longitude: z.number(),
  distanceDebut: z.number().min(0),
  distanceFin: z.number().min(0),
  prix: z.number().min(1, 'Le prix doit être supérieur à 0'),
  commission: z.number().min(0),
});

export type PriceListFormData = z.infer<typeof priceListSchema>;
```

- [ ] **Commit**

```bash
rtk git add features/price-list/schemas/price-list.schema.ts
rtk git commit -m "feat(price-list): add unified Zod schema in features/"
```

---

## Task 2 — Hook dans `features/`

**Files:**
- Create: `features/price-list/hooks/use-price-list-table.ts`

### Contexte
Copie et nettoyage de `app/(protected)/price-list/usePriceLiceDefined.tsx`. On supprime `columns` et `renderCell` (qui vont dans le fichier de colonnes), et on ajoute l'état du modal d'édition. Le modal de création reste dans `header.tsx` (il est dans un Server Component wrapper, le state doit être local à `header.tsx`).

- [ ] **Créer le hook**

```typescript
// features/price-list/hooks/use-price-list-table.ts
'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import { useCallback, useEffect, useState } from 'react';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';
import { IRestaurant } from '@/features/restaurants';

export type EditModalState = {
  open: boolean;
  selectedFee: DeliveryFee | null;
};

interface Props {
  initialData: RestaurantDefini[];
}

export default function usePriceListTable({ initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const tabs = initialData.map((r) => ({ id: r.id, nomComplet: r.nomEtablissement }));
  const initialSelectedKey = searchParams.get('restoId') || (initialData.length > 0 ? initialData[0].id : null);

  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey);
  const [currentRestaurant, setCurrentRestaurant] = useState<IRestaurant | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 0 });
  const [deliveryFeesList, setDeliveryFeesList] = useState<DeliveryFee[]>([]);
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, selectedFee: null });

  useEffect(() => {
    if (!selectedKey && initialData.length > 0) setSelectedKey(initialData[0].id);
  }, [initialData, selectedKey]);

  const handleChangeSelectedKey = (key: string) => {
    setSelectedKey(key);
    params.set('restoId', key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (!selectedKey) return;
    getDetailRestaurant(selectedKey).then((d) => { if (d) setCurrentRestaurant(d); });
  }, [selectedKey]);

  const handleFetchDeliveryFee = useCallback(
    async (restaurantId: string) => {
      const data = await getPriceListByRestaurant(restaurantId, currentPage, 10);
      if (data) {
        setDeliveryFeesList(data.content);
        setMeta({ totalItems: data.totalElements, totalPages: data.totalPages });
      }
    },
    [currentPage],
  );

  useEffect(() => {
    if (currentRestaurant) handleFetchDeliveryFee(currentRestaurant.id);
  }, [currentRestaurant, handleFetchDeliveryFee]);

  const handleChangePage = (page: number) => {
    if (page - 1 >= 0) setCurrentPage(page - 1);
  };

  const search = searchParams.get('search');
  const deliveryFees = search
    ? deliveryFeesList.filter(
        (item) =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.zone.toLowerCase().includes(search.toLowerCase()),
      )
    : deliveryFeesList;

  const openEditModal = useCallback((fee: DeliveryFee) => {
    setEditModal({ open: true, selectedFee: fee });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ open: false, selectedFee: null });
  }, []);

  return {
    selectedKey,
    tabs,
    deliveryFees,
    handleFetchDeliveryFee,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    pagination: {
      currentPage: currentPage + 1,
      totalPages: meta.totalPages,
      totalItems: meta.totalItems,
      onPageChange: handleChangePage,
    },
  };
}
```

- [ ] **Commit**

```bash
rtk git add features/price-list/hooks/use-price-list-table.ts
rtk git commit -m "feat(price-list): add usePriceListTable hook in features/"
```

---

## Task 3 — Fichier de colonnes

**Files:**
- Create: `components/dashboard/price-liste/price-list-columns.tsx`

### Contexte
Extrait le tableau `columns` et la fonction `renderCell` de `usePriceLiceDefined.tsx`. La colonne `actions` appelle désormais `onEdit(fee)` (callback vers le hook) au lieu d'embarquer `FormUpDate`. `PriceListeTools` reste pour la suppression.

- [ ] **Créer le fichier de colonnes**

```tsx
// components/dashboard/price-liste/price-list-columns.tsx
'use client';
import { Tooltip } from '@heroui/react';
import { IconEdit } from '@tabler/icons-react';
import { useCallback } from 'react';
import { DeliveryFee } from '@/types/price-list';
import { IRestaurant } from '@/features/restaurants';
import PriceListeTools from './price-list-tools';

export const priceListColumns = [
  { name: 'Nom', uid: 'name' },
  { name: 'Zone', uid: 'zone' },
  { name: 'Distance', uid: 'distance' },
  { name: 'Coût de livraison', uid: 'prix' },
  { name: 'Commission', uid: 'commission' },
  { name: 'Action', uid: 'actions' },
];

interface RenderCellProps {
  currentRestaurant: IRestaurant | null;
  onEdit: (fee: DeliveryFee) => void;
}

export function usePriceListRenderCell({ currentRestaurant, onEdit }: RenderCellProps) {
  return useCallback(
    (deliveryFee: DeliveryFee, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return <span>{deliveryFee.name}</span>;
        case 'zone':
          return <span>{deliveryFee.zone}</span>;
        case 'distance':
          return <span>{deliveryFee.distanceFin} Km</span>;
        case 'prix':
          return <span>{deliveryFee.prix} (XOF)</span>;
        case 'commission':
          return (
            <span>
              {deliveryFee.commission}
              {currentRestaurant?.typeCommission === 'POURCENTAGE'
                ? ' (%)'
                : currentRestaurant?.typeCommission === 'FIXE'
                  ? ' (XOF)'
                  : ' (type non défini)'}
            </span>
          );
        case 'actions':
          return (
            <div className="relative flex items-center gap-2">
              <Tooltip content="Modifier">
                <button
                  type="button"
                  className="text-lg text-default-400 cursor-pointer active:opacity-50"
                  onClick={() => onEdit(deliveryFee)}
                >
                  <IconEdit />
                </button>
              </Tooltip>
              <Tooltip color="danger" content="Supprimer">
                <PriceListeTools id={deliveryFee.id ?? ''} />
              </Tooltip>
            </div>
          );
        default:
          return null;
      }
    },
    [currentRestaurant?.typeCommission, onEdit],
  );
}
```

- [ ] **Commit**

```bash
rtk git add components/dashboard/price-liste/price-list-columns.tsx
rtk git commit -m "feat(price-list): extract columns and renderCell to dedicated file"
```

---

## Task 4 — Modal unifié

**Files:**
- Create: `components/dashboard/price-liste/price-list-form-modal.tsx`

### Contexte
Ce composant remplace `FormUpDate.tsx` (edit Popover) et le form embarqué dans le Popover de `header.tsx` (create). Il reprend toute la logique Google Maps des deux fichiers existants. `mode='create'` affiche le select restaurant. `mode='edit'` le masque. La commission s'affiche quand `typeCommission` est défini dans le restaurant sélectionné. Les champs `distanceFin` + `prix` sont côte à côte, ainsi que `name` + restaurant (create).

**Type partagé :** `RestaurantOption` est une interface minimale compatible avec `Restaurant` et `RestaurantDefini` — le modal accepte les deux sans casting explicite.

- [ ] **Créer le modal**

```tsx
// components/dashboard/price-liste/price-list-form-modal.tsx
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

  const { control, handleSubmit, setValue, getValues, reset, watch, formState: { errors } } = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: buildDefaults(initialData),
  });

  // Reset form each time modal opens
  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(initialData));
    setDistanceDisplay(initialData?.distanceFin ?? 0);
    setSuggestions([]);
    // Resolve initial restaurant info
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

  // Update restaurant context when user selects one (create mode)
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
        const result = isEdit
          ? await updatePriceList({ ...data, id: initialData?.id })
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
          {/* Row 1 : name + restaurant select (create) or name alone (edit) */}
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

          {/* Zone with Google Maps autocomplete */}
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

          {/* Hidden fields */}
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
```

- [ ] **Commit**

```bash
rtk git add components/dashboard/price-liste/price-list-form-modal.tsx
rtk git commit -m "feat(price-list): add unified PriceListFormModal (create + edit)"
```

---

## Task 5 — Mise à jour `header.tsx`

**Files:**
- Modify: `components/dashboard/price-liste/header.tsx`

### Contexte
Supprimer le Popover avec le form embarqué. Le bouton "Ajouter" ouvre `PriceListFormModal` avec `mode="create"`. `header.tsx` gère son propre `useState` pour l'ouverture du modal create (c'est un client component, pas besoin de remonter le state). `initialData` reste `Restaurant[]` tel que fourni par `SectionHeader.tsx` — compatible avec `RestaurantOption`.

- [ ] **Remplacer le contenu de `header.tsx`**

```tsx
// components/dashboard/price-liste/header.tsx
'use client';
import { title } from '@/components/primitives';
import { ArrowDownToLine, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { Restaurant } from '@/types/models';
import TextInputToUrl from './searchDelivery';
import PriceListFormModal, { RestaurantOption } from './price-list-form-modal';

export default function Header({ initialData }: { initialData: Restaurant[] | null }) {
  const [createOpen, setCreateOpen] = useState(false);

  const restaurants: RestaurantOption[] = (initialData ?? []).map((r) => ({
    id: r.id,
    nomEtablissement: r.nomEtablissement,
    latitude: r.latitude ?? 0,
    longitude: r.longitude ?? 0,
    typeCommission: r.typeCommission ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className={title({ size: 'h3', class: 'text-primary' })}>Gestions des frais de livraison</h1>
      </div>

      <div className="py-6 flex items-center justify-between">
        <div className="relative">
          <TextInputToUrl />
        </div>

        <div className="flex pt-0 flex-wrap gap-2 sm:pt-4 lg:pt-0 md:pt-0 xl:pt-0">
          <Button variant="bordered" endContent={<ArrowDownToLine />}>
            Exporter
          </Button>
          <Button color="danger" endContent={<Plus />} onPress={() => setCreateOpen(true)}>
            Ajouter
          </Button>
        </div>
      </div>

      <PriceListFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        restaurants={restaurants}
      />
    </div>
  );
}
```

- [ ] **Vérifier que `Restaurant` de `@/types/models` a bien les champs `latitude`, `longitude`, `typeCommission`, `nomEtablissement`** — si un champ manque ou a un nom différent, adapter le mapping dans `restaurants`.

- [ ] **Commit**

```bash
rtk git add components/dashboard/price-liste/header.tsx
rtk git commit -m "refactor(price-list): replace create Popover with PriceListFormModal in header"
```

---

## Task 6 — Mise à jour `content.tsx`

**Files:**
- Modify: `app/(protected)/price-list/content.tsx`

### Contexte
`content.tsx` importe maintenant le hook depuis `features/`, les colonnes depuis le fichier dédié, et rend `PriceListFormModal` pour l'édition. `initialData: RestaurantDefini[]` est déjà disponible et compatible avec `RestaurantOption`.

- [ ] **Remplacer le contenu de `content.tsx`**

```tsx
// app/(protected)/price-list/content.tsx
'use client';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Pagination, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs } from '@heroui/react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';
import usePriceListTable from '@/features/price-list/hooks/use-price-list-table';
import { priceListColumns, usePriceListRenderCell } from '@/components/dashboard/price-liste/price-list-columns';
import PriceListFormModal, { RestaurantOption } from '@/components/dashboard/price-liste/price-list-form-modal';

interface Props {
  initialData: RestaurantDefini[];
}

const tabsItems = [
  { id: '/price-list', href: '/price-list', label: 'Liste des restaurants définis' },
  { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indéfinis' },
];

export default function Content({ initialData }: Props) {
  const {
    selectedKey,
    tabs,
    deliveryFees,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    pagination,
  } = usePriceListTable({ initialData });

  const renderCell = usePriceListRenderCell({ currentRestaurant, onEdit: openEditModal });

  const restaurantOptions = tabs
    .map((tab) => ({ value: tab.id, label: tab.nomComplet }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const restaurants: RestaurantOption[] = initialData.map((r) => ({
    id: r.id,
    nomEtablissement: r.nomEtablissement,
    latitude: r.latitude,
    longitude: r.longitude,
    typeCommission: r.typeCommission ?? null,
  }));

  return (
    <>
      <Tabs color="primary" variant="underlined" items={tabsItems} selectedKey={tabsItems.find((tab) => tab.id === '/price-list')?.id} className="w-full">
        {(item) => <Tab key={item.id} as={Link} href={item.href} title={item.label} />}
      </Tabs>

      <div className="flex flex-col mt-4">
        <div className="flex items-center gap-4 border shadow rounded-xl py-3 px-4">
          <Select
            options={restaurantOptions}
            value={restaurantOptions.find((o) => o.value === selectedKey) ?? null}
            onChange={(opt) => { if (opt?.value) handleChangeSelectedKey(opt.value); }}
            placeholder="Sélectionner un restaurant"
            isClearable
            className="text-xs w-full max-w-sm"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
              valueContainer: (base) => ({ ...base, height: '36px', padding: '0 8px' }),
              indicatorsContainer: (base) => ({ ...base, height: '36px' }),
            }}
          />
        </div>

        <Table
          aria-label="Tableau de Frais de livraison"
          className="mt-4"
          bottomContent={<Pagination initialPage={pagination.currentPage} total={pagination.totalPages} onChange={pagination.onPageChange} />}
        >
          <TableHeader columns={priceListColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                className={column.uid === 'zone' ? 'flex items-center gap-2' : ''}
                align={column.uid === 'actions' ? 'center' : 'start'}
              >
                {column.uid === 'zone' && <Search />} {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={deliveryFees} emptyContent={<EmptyDataTable title="Aucun Frais de Livraison" />}>
            {(item) => (
              <TableRow key={item.id}>
                {priceListColumns.map((column) => (
                  <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit modal */}
      <PriceListFormModal
        mode="edit"
        open={editModal.open}
        onClose={closeEditModal}
        initialData={editModal.selectedFee}
        restaurants={restaurants}
      />
    </>
  );
}
```

- [ ] **Commit**

```bash
rtk git add app/(protected)/price-list/content.tsx
rtk git commit -m "refactor(price-list): wire new hook, columns, and edit modal in content"
```

---

## Task 7 — Nettoyage

**Files:**
- Simplify: `app/(protected)/price-list/usePriceLiceDefined.tsx`
- Delete: `components/dashboard/price-liste/FormUpDate.tsx`

- [ ] **Simplifier `usePriceLiceDefined.tsx`** en re-export (pour ne pas casser d'éventuels imports inconnus)

```typescript
// app/(protected)/price-list/usePriceLiceDefined.tsx
export { default } from '@/features/price-list/hooks/use-price-list-table';
```

- [ ] **Supprimer `FormUpDate.tsx`**

```bash
rm components/dashboard/price-liste/FormUpDate.tsx
```

- [ ] **Vérifier qu'aucun autre fichier n'importe `FormUpDate`**

```bash
rtk grep "FormUpDate" --type=ts
rtk grep "FormUpDate" --type=tsx
```

- [ ] **Vérifier qu'aucun autre fichier n'importe `usePriceLiceDefined` directement** (à part `content.tsx` qui a été mis à jour)

```bash
rtk grep "usePriceLiceDefined" --type=ts
rtk grep "usePriceLiceDefined" --type=tsx
```

- [ ] **Commit**

```bash
rtk git add -A
rtk git commit -m "refactor(price-list): remove FormUpDate, simplify usePriceLiceDefined to re-export"
```

---

## Task 8 — Vérification finale

- [ ] **Vérifier les erreurs TypeScript**

```bash
rtk tsc --noEmit
```

Erreurs attendues à corriger si présentes :
- Type mismatch sur `Restaurant` → ajuster le mapping dans `header.tsx` (Task 5, étape 2)
- `updatePriceList` / `createDeliveryFee` types → ajouter cast `as any` temporaire ou adapter le schéma

- [ ] **Lancer le dev server et vérifier visuellement**

```bash
pnpm dev
```

Points à vérifier :
1. Tableau de prix de livraison s'affiche correctement
2. Bouton "Ajouter" dans le header ouvre le modal (create)
3. Icône edit dans la colonne actions ouvre le modal (edit) avec les données pré-remplies
4. Autocomplete Google Maps fonctionne dans les deux modes
5. Distance se calcule automatiquement après sélection d'une zone
6. Commission s'affiche/masque selon `typeCommission` du restaurant
7. Soumission create → toast succès, tableau rafraîchi
8. Soumission edit → toast succès, tableau rafraîchi
9. Suppression fonctionne toujours (non modifié)

- [ ] **Commit final si tout est OK**

```bash
rtk git commit -m "chore(price-list): verify refactoring — no regressions"
```
