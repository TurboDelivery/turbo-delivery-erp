# Entrées Caisse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la gestion complète des entrées caisse — mini-tableau dans le dashboard + page dédiée avec filtres et pagination.

**Architecture:** Le code métier va dans `features/entrees-caisse/` (pattern `features/recouvrements/`). Les composants affichage dans `components/finance/entrees-caisse/`. La page full-list est une nouvelle route Next.js. `DashboardPerformance.tsx` est modifié pour y intégrer les années dynamiques, le bouton de création et le mini-tableau.

**Tech Stack:** React Query (`@tanstack/react-query`), TanStack Table (`@tanstack/react-table`), nuqs (`useQueryStates`), Zod + react-hook-form, HeroUI (`Table`, `Pagination`), shadcn (`Dialog`, `Input`, `Button`, `Label`, `AlertDialog`), `CalendarInput` (`@/components/block/dateInput`), date-fns.

---

## File Map

| Fichier | Rôle |
|---|---|
| `features/entrees-caisse/types/entree-caisse.types.ts` | Interfaces TypeScript |
| `features/entrees-caisse/schemas/entree-caisse.schema.ts` | Validation Zod + DTOs |
| `features/entrees-caisse/apis/entree-caisse.api.ts` | Appels HTTP via `api.request` |
| `features/entrees-caisse/filters/entree-caisse.filter.ts` | Définition nuqs des filtres URL |
| `features/entrees-caisse/queries/index.query.ts` | Clés de cache + `useInvalidateEntreeCaisseQuery` |
| `features/entrees-caisse/queries/entree-caisse-list.query.ts` | Hook liste simple (dashboard) |
| `features/entrees-caisse/queries/entree-caisse-paginated.query.ts` | Hook liste paginée (page dédiée) |
| `features/entrees-caisse/queries/entree-caisse.mutation.ts` | Mutations create / update / delete |
| `features/entrees-caisse/columns/entree-caisse-columns.tsx` | Définitions colonnes TanStack Table |
| `features/entrees-caisse/hooks/use-entree-caisse-table.ts` | Hook complet table + filtres + pagination |
| `components/finance/entrees-caisse/creer-entree-caisse-modal.tsx` | Modal création |
| `components/finance/entrees-caisse/modifier-entree-caisse-modal.tsx` | Modal modification |
| `components/finance/entrees-caisse/supprimer-entree-caisse-modal.tsx` | AlertDialog suppression |
| `components/finance/entrees-caisse/entree-caisse-filters.tsx` | Barre de filtres (date + search) |
| `components/finance/entrees-caisse/entree-caisse-table.tsx` | Tableau complet (page dédiée) |
| `components/finance/entrees-caisse/entree-caisse-mini-table.tsx` | Mini-tableau dashboard (5 derniers) |
| `app/(protected)/finance/entrees-caisse/page.tsx` | Page dédiée liste complète |
| `feature-finance/rapports-performance/components/DashboardPerformance.tsx` | **Modifié** : années dynamiques + bouton + mini-table |

---

## Task 1 : Types + Schéma Zod

**Files:**
- Create: `features/entrees-caisse/types/entree-caisse.types.ts`
- Create: `features/entrees-caisse/schemas/entree-caisse.schema.ts`

- [ ] **Créer les types TypeScript**

```typescript
// features/entrees-caisse/types/entree-caisse.types.ts
export interface IEntreeCaisse {
  id: string;
  createdAt: string;
  updatedAt: string;
  libelle: string;
  montant: number;
  dateEntree: string;
  commentaire: string;
}

export interface IEntreeCaisseParams {
  debut?: string;
  fin?: string;
  restaurantId?: string;
}

export interface IEntreeCaissePaginatedParams {
  page?: number;
  size?: number;
  debut?: string;
  fin?: string;
}
```

- [ ] **Créer le schéma Zod**

```typescript
// features/entrees-caisse/schemas/entree-caisse.schema.ts
import { z } from 'zod';

export const entreeCaisseSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est obligatoire'),
  montant: z.number().min(0, 'Le montant doit être positif'),
  dateEntree: z.string().min(1, "La date d'entrée est obligatoire"),
  commentaire: z.string().optional().default(''),
});

export type EntreeCaisseCreateDTO = z.infer<typeof entreeCaisseSchema>;

export const entreeCaisseUpdateSchema = entreeCaisseSchema.partial();
export type EntreeCaisseUpdateDTO = z.infer<typeof entreeCaisseUpdateSchema>;
```

- [ ] **Commit**

```bash
rtk git add features/entrees-caisse/types/entree-caisse.types.ts features/entrees-caisse/schemas/entree-caisse.schema.ts
rtk git commit -m "feat(entrees-caisse): add types and Zod schema"
```

---

## Task 2 : Couche API

**Files:**
- Create: `features/entrees-caisse/apis/entree-caisse.api.ts`

- [ ] **Créer l'API**

```typescript
// features/entrees-caisse/apis/entree-caisse.api.ts
import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { PaginatedResponse } from '@/types';
import {
  IEntreeCaisse,
  IEntreeCaisseParams,
  IEntreeCaissePaginatedParams,
} from '../types/entree-caisse.types';
import {
  EntreeCaisseCreateDTO,
  EntreeCaisseUpdateDTO,
} from '../schemas/entree-caisse.schema';

export interface IEntreeCaisseAPI {
  lister(params?: IEntreeCaisseParams): Promise<IEntreeCaisse[]>;
  listerPagine(params?: IEntreeCaissePaginatedParams): Promise<PaginatedResponse<IEntreeCaisse>>;
  obtenir(id: string): Promise<IEntreeCaisse>;
  creer(data: EntreeCaisseCreateDTO): Promise<IEntreeCaisse>;
  modifier(id: string, data: EntreeCaisseUpdateDTO): Promise<IEntreeCaisse>;
  supprimer(id: string): Promise<IEntreeCaisse>;
}

export const entreeCaisseAPI: IEntreeCaisseAPI = {
  lister(params?: IEntreeCaisseParams): Promise<IEntreeCaisse[]> {
    return api.request<IEntreeCaisse[]>({
      endpoint: 'finance/entrees-caisse',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  listerPagine(params?: IEntreeCaissePaginatedParams): Promise<PaginatedResponse<IEntreeCaisse>> {
    return api.request<PaginatedResponse<IEntreeCaisse>>({
      endpoint: 'finance/entrees-caisse/pagination',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenir(id: string): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: `finance/entrees-caisse/${id}`,
      method: 'GET',
    });
  },

  creer(data: EntreeCaisseCreateDTO): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: 'finance/entrees-caisse',
      method: 'POST',
      data,
    });
  },

  modifier(id: string, data: EntreeCaisseUpdateDTO): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: `finance/entrees-caisse/${id}`,
      method: 'PUT',
      data,
    });
  },

  supprimer(id: string): Promise<IEntreeCaisse> {
    return api.request<IEntreeCaisse>({
      endpoint: `finance/entrees-caisse/${id}`,
      method: 'DELETE',
    });
  },
};
```

- [ ] **Commit**

```bash
rtk git add features/entrees-caisse/apis/entree-caisse.api.ts
rtk git commit -m "feat(entrees-caisse): add API layer"
```

---

## Task 3 : Filtres nuqs + Clés de cache

**Files:**
- Create: `features/entrees-caisse/filters/entree-caisse.filter.ts`
- Create: `features/entrees-caisse/queries/index.query.ts`

- [ ] **Créer les filtres nuqs**

```typescript
// features/entrees-caisse/filters/entree-caisse.filter.ts
import { parseAsInteger, parseAsIsoDate, parseAsString } from 'nuqs';
import { subMonths } from 'date-fns';

export const entreeCaisseFiltersClient = {
  filter: {
    debut: parseAsIsoDate.withDefault(subMonths(new Date(), 1)),
    fin: parseAsIsoDate.withDefault(new Date()),
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      debut: 'ecDebut',
      fin: 'ecFin',
      search: 'ecSearch',
      page: 'ecPage',
      size: 'ecSize',
    },
  },
};
```

- [ ] **Créer les clés de cache et le hook d'invalidation**

```typescript
// features/entrees-caisse/queries/index.query.ts
import { useQueryClient } from '@tanstack/react-query';

export const entreeCaisseKeys = {
  all: ['entrees-caisse'] as const,
  lists: () => [...entreeCaisseKeys.all, 'list'] as const,
  list: (params?: unknown) => [...entreeCaisseKeys.lists(), params] as const,
  paginated: (params?: unknown) => [...entreeCaisseKeys.all, 'paginated', params] as const,
  details: () => [...entreeCaisseKeys.all, 'detail'] as const,
  detail: (id: string) => [...entreeCaisseKeys.details(), id] as const,
};

export const useInvalidateEntreeCaisseQuery = () => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: entreeCaisseKeys.all });
  };
};
```

- [ ] **Commit**

```bash
rtk git add features/entrees-caisse/filters/entree-caisse.filter.ts features/entrees-caisse/queries/index.query.ts
rtk git commit -m "feat(entrees-caisse): add nuqs filters and query keys"
```

---

## Task 4 : Queries (liste + paginée)

**Files:**
- Create: `features/entrees-caisse/queries/entree-caisse-list.query.ts`
- Create: `features/entrees-caisse/queries/entree-caisse-paginated.query.ts`

- [ ] **Créer le hook de liste simple (pour le dashboard)**

```typescript
// features/entrees-caisse/queries/entree-caisse-list.query.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { entreeCaisseAPI } from '../apis/entree-caisse.api';
import { IEntreeCaisseParams } from '../types/entree-caisse.types';
import { entreeCaisseKeys } from './index.query';

export const useEntreeCaisseListQuery = (params?: IEntreeCaisseParams) => {
  return useQuery({
    queryKey: entreeCaisseKeys.list(params),
    queryFn: () => entreeCaisseAPI.lister(params),
    staleTime: 5 * 60 * 1000,
  });
};
```

- [ ] **Créer le hook de liste paginée (pour la page dédiée)**

```typescript
// features/entrees-caisse/queries/entree-caisse-paginated.query.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { entreeCaisseAPI } from '../apis/entree-caisse.api';
import { IEntreeCaissePaginatedParams } from '../types/entree-caisse.types';
import { entreeCaisseKeys } from './index.query';

export const useEntreeCaissePaginatedQuery = (params?: IEntreeCaissePaginatedParams) => {
  return useQuery({
    queryKey: entreeCaisseKeys.paginated(params),
    queryFn: () => entreeCaisseAPI.listerPagine(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};
```

- [ ] **Commit**

```bash
rtk git add features/entrees-caisse/queries/entree-caisse-list.query.ts features/entrees-caisse/queries/entree-caisse-paginated.query.ts
rtk git commit -m "feat(entrees-caisse): add list and paginated queries"
```

---

## Task 5 : Mutations (create / update / delete)

**Files:**
- Create: `features/entrees-caisse/queries/entree-caisse.mutation.ts`

- [ ] **Créer les mutations**

```typescript
// features/entrees-caisse/queries/entree-caisse.mutation.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { entreeCaisseAPI } from '../apis/entree-caisse.api';
import { useInvalidateEntreeCaisseQuery } from './index.query';
import {
  EntreeCaisseCreateDTO,
  EntreeCaisseUpdateDTO,
} from '../schemas/entree-caisse.schema';

export const useCreerEntreeCaisseMutation = () => {
  const invalidate = useInvalidateEntreeCaisseQuery();

  return useMutation({
    mutationFn: (data: EntreeCaisseCreateDTO) => entreeCaisseAPI.creer(data),
    onSuccess: async () => {
      await invalidate();
      toast.success('Entrée caisse créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierEntreeCaisseMutation = () => {
  const invalidate = useInvalidateEntreeCaisseQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntreeCaisseUpdateDTO }) =>
      entreeCaisseAPI.modifier(id, data),
    onSuccess: async () => {
      await invalidate();
      toast.success('Entrée caisse modifiée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerEntreeCaisseMutation = () => {
  const invalidate = useInvalidateEntreeCaisseQuery();

  return useMutation({
    mutationFn: (id: string) => entreeCaisseAPI.supprimer(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Entrée caisse supprimée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
```

- [ ] **Commit**

```bash
rtk git add features/entrees-caisse/queries/entree-caisse.mutation.ts
rtk git commit -m "feat(entrees-caisse): add create/update/delete mutations"
```

---

## Task 6 : Colonnes TanStack Table

**Files:**
- Create: `features/entrees-caisse/columns/entree-caisse-columns.tsx`

> ⚠️ Les modals `ModifierEntreeCaisseModal` et `SupprimerEntreeCaisseModal` seront créés aux Tasks 8 et 9. Créer ce fichier en dernier ou laisser les imports en placeholder temporaire et mettre à jour après les Tasks 8-9.

- [ ] **Créer les colonnes**

```tsx
// features/entrees-caisse/columns/entree-caisse-columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IEntreeCaisse } from '../types/entree-caisse.types';
import { ModifierEntreeCaisseModal } from '@/components/finance/entrees-caisse/modifier-entree-caisse-modal';
import { SupprimerEntreeCaisseModal } from '@/components/finance/entrees-caisse/supprimer-entree-caisse-modal';

export const entreeCaisseColumns: ColumnDef<IEntreeCaisse>[] = [
  {
    accessorKey: 'libelle',
    header: 'Libellé',
  },
  {
    accessorKey: 'montant',
    header: 'Montant',
    cell: ({ row }) =>
      `${row.original.montant.toLocaleString('fr-FR')} FCFA`,
  },
  {
    accessorKey: 'dateEntree',
    header: 'Date',
    cell: ({ row }) =>
      format(new Date(row.original.dateEntree), 'dd/MM/yyyy', { locale: fr }),
  },
  {
    accessorKey: 'commentaire',
    header: 'Commentaire',
    cell: ({ row }) => row.original.commentaire || '—',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2 justify-center">
        <ModifierEntreeCaisseModal entreeCaisse={row.original} />
        <SupprimerEntreeCaisseModal entreeCaisse={row.original} />
      </div>
    ),
  },
];
```

- [ ] **Commit** (après Task 8 et 9)

```bash
rtk git add features/entrees-caisse/columns/entree-caisse-columns.tsx
rtk git commit -m "feat(entrees-caisse): add TanStack Table columns"
```

---

## Task 7 : Hook useEntreeCaisseTable

**Files:**
- Create: `features/entrees-caisse/hooks/use-entree-caisse-table.ts`

- [ ] **Créer le hook**

```typescript
// features/entrees-caisse/hooks/use-entree-caisse-table.ts
'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { entreeCaisseFiltersClient } from '../filters/entree-caisse.filter';
import { useEntreeCaissePaginatedQuery } from '../queries/entree-caisse-paginated.query';
import { entreeCaisseColumns } from '../columns/entree-caisse-columns';

export function useEntreeCaisseTable() {
  const [filters, setFilters] = useQueryStates(
    entreeCaisseFiltersClient.filter,
    entreeCaisseFiltersClient.option,
  );

  const params = useMemo(
    () => ({
      page: filters.page,
      size: filters.size,
      debut: filters.debut ? format(filters.debut, 'yyyy-MM-dd') : undefined,
      fin: filters.fin ? format(filters.fin, 'yyyy-MM-dd') : undefined,
    }),
    [filters],
  );

  const { data, isLoading, isFetching } = useEntreeCaissePaginatedQuery(params);

  // Filtre client-side sur le libellé
  const filteredData = useMemo(() => {
    const content = data?.content || [];
    if (!filters.search) return content;
    return content.filter((e) =>
      e.libelle.toLowerCase().includes(filters.search.toLowerCase()),
    );
  }, [data, filters.search]);

  const table = useReactTable({
    data: filteredData,
    columns: entreeCaisseColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages || 0,
  });

  const pagination = {
    pageCount: data?.totalPages || 0,
    totalItems: data?.totalElements || 0,
    page: filters.page,
    handlePageChange: (newPage: number) => setFilters({ page: newPage - 1 }),
  };

  const handleDateChange = (debut?: Date, fin?: Date) =>
    setFilters({
      debut: debut ?? filters.debut,
      fin: fin ?? filters.fin,
      page: 0,
    });

  const handleSearchChange = (search: string) => setFilters({ search, page: 0 });

  const handleReset = () => setFilters({ search: '', page: 0 });

  return {
    table,
    isLoading,
    isFetching,
    filters,
    setFilters,
    pagination,
    handleDateChange,
    handleSearchChange,
    handleReset,
  };
}
```

- [ ] **Commit**

```bash
rtk git add features/entrees-caisse/hooks/use-entree-caisse-table.ts
rtk git commit -m "feat(entrees-caisse): add useEntreeCaisseTable hook"
```

---

## Task 8 : Modal de création

**Files:**
- Create: `components/finance/entrees-caisse/creer-entree-caisse-modal.tsx`

- [ ] **Créer le composant**

```tsx
// components/finance/entrees-caisse/creer-entree-caisse-modal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarInput } from '@/components/block/dateInput';
import {
  entreeCaisseSchema,
  EntreeCaisseCreateDTO,
} from '@/features/entrees-caisse/schemas/entree-caisse.schema';
import { useCreerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';

export function CreerEntreeCaisseModal() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const mutation = useCreerEntreeCaisseMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EntreeCaisseCreateDTO>({
    resolver: zodResolver(entreeCaisseSchema),
    defaultValues: {
      libelle: '',
      montant: 0,
      dateEntree: format(new Date(), 'yyyy-MM-dd'),
      commentaire: '',
    },
  });

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync(data);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle entrée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nouvelle entrée caisse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              {...register('libelle')}
              placeholder="Libellé de l'entrée"
            />
            {errors.libelle && (
              <p className="text-red-500 text-xs">{errors.libelle.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              {...register('montant', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.montant && (
              <p className="text-red-500 text-xs">{errors.montant.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Date d'entrée</Label>
            <CalendarInput
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                if (date) setValue('dateEntree', format(date, 'yyyy-MM-dd'));
              }}
              placeholder="Sélectionnez une date"
            />
            {errors.dateEntree && (
              <p className="text-red-500 text-xs">{errors.dateEntree.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Input
              id="commentaire"
              {...register('commentaire')}
              placeholder="Commentaire (optionnel)"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Commit**

```bash
rtk git add components/finance/entrees-caisse/creer-entree-caisse-modal.tsx
rtk git commit -m "feat(entrees-caisse): add creation modal"
```

---

## Task 9 : Modal de modification + AlertDialog de suppression

**Files:**
- Create: `components/finance/entrees-caisse/modifier-entree-caisse-modal.tsx`
- Create: `components/finance/entrees-caisse/supprimer-entree-caisse-modal.tsx`

- [ ] **Créer le modal de modification**

```tsx
// components/finance/entrees-caisse/modifier-entree-caisse-modal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarInput } from '@/components/block/dateInput';
import {
  entreeCaisseSchema,
  EntreeCaisseCreateDTO,
} from '@/features/entrees-caisse/schemas/entree-caisse.schema';
import { useModifierEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';
import { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';

interface ModifierEntreeCaisseModalProps {
  entreeCaisse: IEntreeCaisse;
}

export function ModifierEntreeCaisseModal({ entreeCaisse }: ModifierEntreeCaisseModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(entreeCaisse.dateEntree),
  );
  const mutation = useModifierEntreeCaisseMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EntreeCaisseCreateDTO>({
    resolver: zodResolver(entreeCaisseSchema),
    defaultValues: {
      libelle: entreeCaisse.libelle,
      montant: entreeCaisse.montant,
      dateEntree: entreeCaisse.dateEntree,
      commentaire: entreeCaisse.commentaire,
    },
  });

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync({ id: entreeCaisse.id, data });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Modifier l'entrée caisse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input id="libelle" {...register('libelle')} />
            {errors.libelle && (
              <p className="text-red-500 text-xs">{errors.libelle.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              {...register('montant', { valueAsNumber: true })}
            />
            {errors.montant && (
              <p className="text-red-500 text-xs">{errors.montant.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Date d'entrée</Label>
            <CalendarInput
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                if (date) setValue('dateEntree', format(date, 'yyyy-MM-dd'));
              }}
            />
            {errors.dateEntree && (
              <p className="text-red-500 text-xs">{errors.dateEntree.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Input id="commentaire" {...register('commentaire')} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Créer l'AlertDialog de suppression**

```tsx
// components/finance/entrees-caisse/supprimer-entree-caisse-modal.tsx
'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';
import { useSupprimerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';

interface SupprimerEntreeCaisseModalProps {
  entreeCaisse: IEntreeCaisse;
}

export function SupprimerEntreeCaisseModal({ entreeCaisse }: SupprimerEntreeCaisseModalProps) {
  const mutation = useSupprimerEntreeCaisseMutation();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'entrée caisse</AlertDialogTitle>
          <AlertDialogDescription>
            Supprimer «{entreeCaisse.libelle}» ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate(entreeCaisse.id)}
            className="bg-red-500 hover:bg-red-600"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Revenir sur Task 6 et finaliser les colonnes** (les imports des modals sont maintenant disponibles)

- [ ] **Commit**

```bash
rtk git add components/finance/entrees-caisse/modifier-entree-caisse-modal.tsx components/finance/entrees-caisse/supprimer-entree-caisse-modal.tsx features/entrees-caisse/columns/entree-caisse-columns.tsx
rtk git commit -m "feat(entrees-caisse): add edit/delete modals and finalize columns"
```

---

## Task 10 : Barre de filtres

**Files:**
- Create: `components/finance/entrees-caisse/entree-caisse-filters.tsx`

- [ ] **Créer le composant filtres**

```tsx
// components/finance/entrees-caisse/entree-caisse-filters.tsx
'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarInput } from '@/components/block/dateInput';

interface EntreeCaisseFiltersProps {
  filters: {
    search: string;
    debut: Date;
    fin: Date;
  };
  handleSearchChange: (search: string) => void;
  handleDateChange: (debut?: Date, fin?: Date) => void;
  handleReset: () => void;
}

export function EntreeCaisseFilters({
  filters,
  handleSearchChange,
  handleDateChange,
  handleReset,
}: EntreeCaisseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-lg border">
      <div className="space-y-1 flex-1 min-w-[200px]">
        <Label className="text-xs text-gray-500">Rechercher par libellé</Label>
        <Input
          placeholder="Libellé..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Date début</Label>
        <CalendarInput
          value={filters.debut}
          onChange={(date) => handleDateChange(date, filters.fin)}
          placeholder="Date début"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Date fin</Label>
        <CalendarInput
          value={filters.fin}
          onChange={(date) => handleDateChange(filters.debut, date)}
          placeholder="Date fin"
        />
      </div>
      <Button variant="ghost" size="sm" onClick={handleReset}>
        <X className="w-4 h-4 mr-1" />
        Réinitialiser
      </Button>
    </div>
  );
}
```

- [ ] **Commit**

```bash
rtk git add components/finance/entrees-caisse/entree-caisse-filters.tsx
rtk git commit -m "feat(entrees-caisse): add filters bar component"
```

---

## Task 11 : Tableau complet (page dédiée)

**Files:**
- Create: `components/finance/entrees-caisse/entree-caisse-table.tsx`

- [ ] **Créer le composant tableau complet**

```tsx
// components/finance/entrees-caisse/entree-caisse-table.tsx
'use client';

import { flexRender } from '@tanstack/react-table';
import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useEntreeCaisseTable } from '@/features/entrees-caisse/hooks/use-entree-caisse-table';
import { EntreeCaisseFilters } from './entree-caisse-filters';
import { CreerEntreeCaisseModal } from './creer-entree-caisse-modal';

export function EntreeCaisseTable() {
  const {
    table,
    isLoading,
    isFetching,
    pagination,
    filters,
    handleSearchChange,
    handleDateChange,
    handleReset,
  } = useEntreeCaisseTable();

  const colsCount = table.getAllColumns().length;

  return (
    <div className="space-y-4">
      <EntreeCaisseFilters
        filters={filters}
        handleSearchChange={handleSearchChange}
        handleDateChange={handleDateChange}
        handleReset={handleReset}
      />
      <div className="flex justify-end">
        <CreerEntreeCaisseModal />
      </div>
      <div className="overflow-x-auto">
        <Table
          isStriped
          bottomContent={
            pagination.pageCount > 1 ? (
              <div className="flex justify-center pt-4">
                <Pagination
                  total={pagination.pageCount}
                  page={pagination.page + 1}
                  onChange={pagination.handlePageChange}
                  color="primary"
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucune entrée caisse trouvée">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`cell-${j}`}>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={isFetching ? 'opacity-70' : ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
rtk git add components/finance/entrees-caisse/entree-caisse-table.tsx
rtk git commit -m "feat(entrees-caisse): add full table component"
```

---

## Task 12 : Mini-tableau dashboard (5 derniers)

**Files:**
- Create: `components/finance/entrees-caisse/entree-caisse-mini-table.tsx`

- [ ] **Créer le mini-tableau**

```tsx
// components/finance/entrees-caisse/entree-caisse-mini-table.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEntreeCaisseListQuery } from '@/features/entrees-caisse/queries/entree-caisse-list.query';

export function EntreeCaisseMiniTable() {
  const router = useRouter();
  const { data: entries, isLoading } = useEntreeCaisseListQuery();
  const derniers5 = (entries || []).slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          5 dernières entrées caisse
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary"
          onClick={() => router.push('/finance/entrees-caisse')}
        >
          Voir tout
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      <Table isStriped>
        <TableHeader>
          <TableColumn>Libellé</TableColumn>
          <TableColumn>Montant</TableColumn>
          <TableColumn>Date</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="Aucune entrée"
          isLoading={isLoading}
          loadingContent={
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          }
        >
          {derniers5.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-sm">{entry.libelle}</TableCell>
              <TableCell className="text-sm font-semibold">
                {entry.montant.toLocaleString('fr-FR')} FCFA
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {format(new Date(entry.dateEntree), 'dd/MM/yyyy', { locale: fr })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Commit**

```bash
rtk git add components/finance/entrees-caisse/entree-caisse-mini-table.tsx
rtk git commit -m "feat(entrees-caisse): add dashboard mini table"
```

---

## Task 13 : Nouvelle page `/finance/entrees-caisse`

**Files:**
- Create: `app/(protected)/finance/entrees-caisse/page.tsx`

- [ ] **Créer la page**

```tsx
// app/(protected)/finance/entrees-caisse/page.tsx
import { EntreeCaisseTable } from '@/components/finance/entrees-caisse/entree-caisse-table';

export default function EntreesCaissePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Entrées Caisse</h1>
        <p className="text-muted-foreground">
          Gestion et historique des entrées caisse
        </p>
      </div>
      <EntreeCaisseTable />
    </div>
  );
}
```

- [ ] **Commit**

```bash
rtk git add "app/(protected)/finance/entrees-caisse/page.tsx"
rtk git commit -m "feat(entrees-caisse): add dedicated page"
```

---

## Task 14 : Modifier DashboardPerformance

**Files:**
- Modify: `feature-finance/rapports-performance/components/DashboardPerformance.tsx`

- [ ] **Remplacer la liste d'années hardcodée par une liste dynamique, ajouter le bouton de création et le mini-tableau**

Remplacer le contenu complet de `DashboardPerformance.tsx` par :

```tsx
// feature-finance/rapports-performance/components/DashboardPerformance.tsx
'use client';
import { TrendingUp, Users, Briefcase, ArrowUpRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Card, Progress } from '@heroui/react';
import { CardContent } from '@/components/ui/card';
import { useBilanAnnuel } from '../hooks/use-bilan-annuel';
import { CreerEntreeCaisseModal } from '@/components/finance/entrees-caisse/creer-entree-caisse-modal';
import { EntreeCaisseMiniTable } from '@/components/finance/entrees-caisse/entree-caisse-mini-table';

const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 2024 + 1 },
  (_, i) => String(2024 + i),
);

export default function DashboardPerformance() {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { monthsData, isLoading } = useBilanAnnuel(selectedYear);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            Bilan Annuel {selectedYear}
          </h1>
          <div className="flex items-center gap-3">
            <CreerEntreeCaisseModal />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Vue chronologique de la santé financière et opérationnelle
        </p>
      </div>

      {/* Months Grid */}
      <div className="space-y-6">
        {monthsData.map((month) => (
          <Card key={month.month} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-lg font-bold ${month.hasData ? 'text-red-600' : 'text-gray-400'}`}
                >
                  {month.monthName}
                </h2>
                {month.hasData && month.isProfitable && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 hover:bg-green-100"
                  >
                    Rentable
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase">Courses</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{month.courses}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase">Staff</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{month.staff}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Financial Metrics */}
                  {month.hasData && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>CA</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{month.ca}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <span>% Dépenses</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{month.expenses}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Remboursements</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {month.reimbursements}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <Briefcase className="w-3 h-3" />
                            <span>Investissements</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {month.investments}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Progression annuelle</span>
                          <span className="text-gray-500">{month.progress}/12</span>
                        </div>
                        <Progress value={(month.progress / 12) * 100} className="h-2" />
                      </div>
                    </>
                  )}

                  {!month.hasData && (
                    <p className="text-gray-400 text-sm italic">Aucune donnée disponible</p>
                  )}
                </div>

                {/* Profitability Section */}
                {month.hasData && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                      <div className="w-1 h-4 bg-gray-800 rounded-full" />
                      RENTABILITÉ
                    </div>

                    {/* Monthly Result */}
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-600 mb-1">Résultat du mois</p>
                        <p className="text-base sm:text-lg font-bold text-green-700 mb-1 break-all">
                          {month.monthlyResult}
                        </p>
                        <p className="text-xs text-gray-500">Bénéfice mensuel</p>
                      </CardContent>
                    </Card>

                    {/* Cumulative Result */}
                    <Card className="bg-blue-600 text-white border-blue-600">
                      <CardContent className="p-4">
                        <p className="text-xs text-blue-100 mb-1">RENTABILITÉ CUMULÉE YTD</p>
                        <p className="text-base sm:text-lg font-bold mb-1 break-all">
                          {month.cumulativeResult}
                        </p>
                        <p className="text-xs text-blue-100">Depuis : {month.monthName}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs text-blue-100 hover:text-white hover:bg-blue-700 p-0 h-auto"
                        >
                          Voir détails
                          <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Entrées Caisse */}
      <div className="mt-8">
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <EntreeCaisseMiniTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
rtk git add feature-finance/rapports-performance/components/DashboardPerformance.tsx
rtk git commit -m "feat(dashboard): dynamic years, add EntreeCaisse button and mini table"
```

---

## Self-Review

### Couverture du spec

| Exigence | Task |
|---|---|
| Années dynamiques 2024 → now | Task 14 |
| Bouton créer entrée caisse | Task 8 + Task 14 |
| Mini-tableau 5 derniers + "voir plus" | Task 12 + Task 14 |
| Page complète liste 20/page | Task 11 + Task 13 |
| Filtres (date, libellé) sur page complète | Task 10 + Task 7 |
| CRUD complet (create/update/delete) | Task 5 + Tasks 8-9 |
| shadcn + HeroUI | Tous les composants |
| Pattern `features/` (pas `feature-finance/`) | Tasks 1-7 |

### Cohérence des types

- `IEntreeCaisse` défini Task 1, utilisé partout (colonnes, modals, mini-table)
- `EntreeCaisseCreateDTO` = output de `entreeCaisseSchema`, utilisé dans create/edit modals et mutation
- `useModifierEntreeCaisseMutation` reçoit `{ id: string; data: EntreeCaisseUpdateDTO }` → cohérent avec la colonne actions
- `pagination.handlePageChange(newPage: number)` → reçoit 1-based depuis HeroUI, convertit en 0-based dans le hook ✓
- `filters.debut` / `filters.fin` sont des `Date` (nuqs `parseAsIsoDate`) → formatés en `yyyy-MM-dd` dans le hook avant envoi API ✓
