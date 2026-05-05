# TicketTable Refactorisation — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactoriser `TicketTable` (~550 lignes) en composant quasi-présentationnel en extrayant la logique métier vers `features/tickets/`, en corrigeant les bugs identifiés, et en migrant les permissions vers CASL.

**Architecture:** Trois phases indépendantes — Phase 1 corrige les bugs et doublons dans le composant existant, Phase 2 extrait l'état vers des hooks dans `features/tickets/hooks/`, Phase 3 déplace la barre d'insertion au niveau page et remplace les comparaisons de rôle par CASL.

**Tech Stack:** Next.js 14 App Router · React 18 · TypeScript · TanStack Query v4 · CASL (`@casl/ability`) · HeroUI · `react-select` · `uuid`

> **Note :** Pas de test runner configuré. La vérification se fait via `rtk tsc --noEmit` + vérification visuelle dans le navigateur sur `http://localhost:3000/tickets`.

---

## Carte des fichiers

| Fichier | Action |
|---|---|
| `features/tickets/utils/commission.utils.ts` | Créer |
| `features/tickets/hooks/use-ticket-authentication.ts` | Créer |
| `features/tickets/hooks/use-ticket-editing.ts` | Créer |
| `features/tickets/hooks/use-new-tickets.ts` | Créer |
| `features/tickets/hooks/use-tickets.ts` | Modifier |
| `components/tickets/table/ticket-insert-bar.tsx` | Créer |
| `components/tickets/table/ticket-table.tsx` | Modifier (refacto complète) |
| `lib/casl/ability.ts` | Modifier |
| `app/(protected)/tickets/page.tsx` | Modifier |

---

## Phase 1 — Corrections de bugs et élimination des doublons

### Task 1 : Extraire `calculateCommission` vers `commission.utils.ts`

**Fichiers :**
- Créer : `features/tickets/utils/commission.utils.ts`

- [ ] **Créer le fichier utilitaire**

```ts
// features/tickets/utils/commission.utils.ts
import { Restaurant } from '@/types/models';
import { Ticket } from '@/types/bon-livraison.model';

export function calculateCommission(restaurant: Restaurant, montantCommande: number): number | null {
  if (!montantCommande) return null;
  const commission = Number(restaurant.commission ?? 0);
  if (restaurant.typeCommission === 'POURCENTAGE') {
    return Number((montantCommande * (commission / 100)).toFixed(2));
  }
  return null;
}

export function applyTicketPatch(ticket: Ticket, patch: Partial<Ticket>, restaurants: Restaurant[]): Ticket {
  const updated: Ticket = { ...ticket, ...patch };

  if (patch.restaurantId !== undefined) {
    const rest = restaurants.find((r) => r.id === patch.restaurantId);
    if (rest) updated.typeCommission = rest.typeCommission;
  }

  if (patch.montantCommande !== undefined || patch.restaurantId !== undefined) {
    const rest = restaurants.find((r) => r.id === updated.restaurantId);
    if (rest) {
      const commission = calculateCommission(rest, Number(updated.montantCommande || 0));
      if (commission !== null) updated.coutLivraison = commission.toString();
    }
  }

  return updated;
}

export function getRestaurantInfo(restaurantId: string, restaurants: Restaurant[]) {
  const rest = restaurants.find((r) => r.id === restaurantId);
  if (!rest) return undefined;
  return { typeCommission: rest.typeCommission, commission: Number(rest.commission ?? 0) };
}
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : aucune erreur dans `commission.utils.ts`.

- [ ] **Committer**

```powershell
rtk git add features/tickets/utils/commission.utils.ts
rtk git commit -m "feat(tickets): extract commission utils to features layer"
```

---

### Task 2 : Refactoriser les handlers dans `TicketTable` (Phase 1)

**Fichiers :**
- Modifier : `components/tickets/table/ticket-table.tsx`

- [ ] **Supprimer `calculateCommission` et `updateTicketField`, importer depuis utils**

Ajouter l'import en haut du fichier (après les imports existants) :

```ts
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';
```

- [ ] **Supprimer les fonctions inline `calculateCommission` et `updateTicketField`**

Supprimer entièrement les blocs lignes 73–87 (`calculateCommission`) et 108–123 (`updateTicketField`).

- [ ] **Mettre à jour `applyTicketPatch` pour utiliser l'import**

Remplacer la définition inline de `applyTicketPatch` (lignes 89–106) par :

```ts
const patchTicket = useCallback(
  (ticket: Ticket, patch: Partial<Ticket>): Ticket => applyTicketPatch(ticket, patch, restaurants),
  [restaurants],
);
```

- [ ] **Mettre à jour `handleTicketChange` pour utiliser `patchTicket`**

```ts
const handleTicketChange = useCallback(
  (id: string, field: keyof Ticket, value: string) => {
    const isNewTicket = newTickets.some((t) => t.id === id);
    if (isNewTicket) {
      setNewTickets((prev) => prev.map((t) => (t.id === id ? patchTicket(t, { [field]: value }) : t)));
    } else {
      const base = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (base) setEditedTickets((prev) => new Map(prev).set(id, patchTicket(base, { [field]: value })));
    }
  },
  [newTickets, editedTickets, ticketsData, patchTicket, setEditedTickets],
);
```

- [ ] **Mettre à jour `handleTicketPatch` pour utiliser `patchTicket`**

```ts
const handleTicketPatch = useCallback(
  (id: string, patch: Partial<Ticket>) => {
    const isNewTicket = newTickets.some((t) => t.id === id);
    if (isNewTicket) {
      setNewTickets((prev) => prev.map((t) => (t.id === id ? patchTicket(t, patch) : t)));
      return;
    }
    setEditedTickets((prev) => {
      const base = prev.get(id) ?? ticketsData.find((t) => t.id === id);
      if (!base) return prev;
      return new Map(prev).set(id, patchTicket(base, patch));
    });
  },
  [newTickets, ticketsData, patchTicket, setEditedTickets],
);
```

- [ ] **Dédupliquer `getRestaurantInfo` dans `handleSaveNewTicket` et `handleSaveRow`**

```ts
const handleSaveNewTicket = useCallback(
  (id: string) => {
    const ticket = newTickets.find((t) => t.id === id);
    if (!ticket) return;
    createBonLivraisonMutation(
      { ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
      { onSuccess: () => setNewTickets((prev) => prev.filter((t) => t.id !== id)) },
    );
  },
  [newTickets, createBonLivraisonMutation, restaurants],
);

const handleSaveRow = useCallback(
  (id: string) => {
    const ticket = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
    if (!ticket) return;
    updateBonLivraisonMutation(
      { ticketId: id, ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
      {
        onSuccess: () => {
          setEditedTickets((prev) => { const m = new Map(prev); m.delete(id); return m; });
          handleCancelEditRow(id);
        },
      },
    );
  },
  [editedTickets, ticketsData, updateBonLivraisonMutation, setEditedTickets, handleCancelEditRow, restaurants],
);
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Committer**

```powershell
rtk git add components/tickets/table/ticket-table.tsx
rtk git commit -m "refactor(tickets): merge duplicate patch functions, use commission.utils"
```

---

### Task 3 : Unifier la suppression sur `ConfirmModal`

**Fichiers :**
- Modifier : `components/tickets/table/ticket-table.tsx`

- [ ] **Remplacer `ticketToDelete: string | null` par `ticketsToDelete: string[] | null`**

```ts
const [ticketsToDelete, setTicketsToDelete] = useState<string[] | null>(null);
```

- [ ] **Mettre à jour `handleDeleteRow` (suppression unitaire)**

```ts
const handleDeleteRow = useCallback((id: string) => {
  setTicketsToDelete([id]);
}, []);
```

- [ ] **Mettre à jour `handleDeleteRows` (suppression en masse) — supprimer `window.confirm`**

```ts
const handleDeleteRows = useCallback(() => {
  if (selectedRowIds.length === 0) {
    toast.warning('Aucune ligne sélectionnée');
    return;
  }
  setTicketsToDelete(Array.from(selectedRowIds));
}, [selectedRowIds]);
```

- [ ] **Mettre à jour `handleConfirmDelete`**

```ts
const handleConfirmDelete = useCallback(() => {
  if (!ticketsToDelete || ticketsToDelete.length === 0) return;
  for (const id of ticketsToDelete) {
    deleteBonLivraisonMutation(id, {
      onSuccess: () => {
        if (ticketsToDelete.length === 1) toast.success('Le ticket a été supprimé avec succès.');
      },
      onError: () => toast.error('Erreur lors de la suppression du ticket.'),
    });
  }
  setNewTickets((prev) => prev.filter((t) => !ticketsToDelete.includes(t.id)));
  setRowSelection({});
  setTicketsToDelete(null);
}, [ticketsToDelete, deleteBonLivraisonMutation]);
```

- [ ] **Mettre à jour le `ConfirmModal` dans le JSX**

```tsx
<ConfirmModal
  isOpen={ticketsToDelete !== null}
  onClose={() => setTicketsToDelete(null)}
  title={ticketsToDelete?.length === 1 ? 'Supprimer le ticket' : `Supprimer ${ticketsToDelete?.length ?? 0} ticket(s)`}
  isLoading={isDeletingBonLivraison}
  actions={[
    { label: 'Annuler', variant: 'light', onPress: () => setTicketsToDelete(null) },
    { label: 'Supprimer', color: 'danger', onPress: handleConfirmDelete },
  ]}
>
  {ticketsToDelete?.length === 1
    ? 'Confirmez-vous la suppression définitive de ce ticket ? Cette action est irréversible.'
    : `Confirmez-vous la suppression de ${ticketsToDelete?.length ?? 0} ticket(s) ? Cette action est irréversible.`}
</ConfirmModal>
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Vérifier visuellement** — ouvrir `http://localhost:3000/tickets`, sélectionner plusieurs tickets, cliquer Supprimer → le `ConfirmModal` doit s'ouvrir (plus de `window.confirm`).

- [ ] **Committer**

```powershell
rtk git add components/tickets/table/ticket-table.tsx
rtk git commit -m "fix(tickets): replace window.confirm with ConfirmModal for bulk delete"
```

---

## Phase 2 — Extraction des hooks vers `features/tickets/`

### Task 4 : Créer `use-ticket-authentication.ts`

**Fichiers :**
- Créer : `features/tickets/hooks/use-ticket-authentication.ts`

- [ ] **Créer le hook**

```ts
// features/tickets/hooks/use-ticket-authentication.ts
import { useState, useCallback } from 'react';

export function useTicketAuthentication() {
  const [authenticatedIds, setAuthenticatedIds] = useState<Set<string>>(new Set());

  const handleAuthentifier = useCallback((id: string) => {
    setAuthenticatedIds((prev) => new Set(prev).add(id));
  }, []);

  return { authenticatedIds, handleAuthentifier };
}
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

- [ ] **Committer**

```powershell
rtk git add features/tickets/hooks/use-ticket-authentication.ts
rtk git commit -m "feat(tickets): add use-ticket-authentication hook"
```

---

### Task 5 : Créer `use-ticket-editing.ts`

**Fichiers :**
- Créer : `features/tickets/hooks/use-ticket-editing.ts`

- [ ] **Créer le hook**

```ts
// features/tickets/hooks/use-ticket-editing.ts
import { useState, useCallback } from 'react';
import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';

interface UseTicketEditingParams {
  restaurants: Restaurant[];
  ticketsData: Ticket[];
  updateBonLivraisonMutation: (
    vars: { ticketId: string; ticket: Ticket; restaurant?: { typeCommission: string; commission: number } },
    callbacks?: { onSuccess?: () => void },
  ) => void;
}

export function useTicketEditing({ restaurants, ticketsData, updateBonLivraisonMutation }: UseTicketEditingParams) {
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [editedTickets, setEditedTickets] = useState<Map<string, Ticket>>(new Map());

  const handleEditRow = useCallback((id: string) => {
    setEditingIds((prev) => new Set([...prev, id]));
  }, []);

  const handleCancelEditRow = useCallback((id: string) => {
    setEditingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setEditedTickets((prev) => {
      if (!prev.has(id)) return prev;
      const m = new Map(prev);
      m.delete(id);
      return m;
    });
  }, []);

  const handleTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      const base = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (!base) return;
      setEditedTickets((prev) =>
        new Map(prev).set(id, applyTicketPatch(base, { [field]: value }, restaurants)),
      );
    },
    [editedTickets, ticketsData, restaurants],
  );

  const handleTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      setEditedTickets((prev) => {
        const base = prev.get(id) ?? ticketsData.find((t) => t.id === id);
        if (!base) return prev;
        return new Map(prev).set(id, applyTicketPatch(base, patch, restaurants));
      });
    },
    [ticketsData, restaurants],
  );

  const handleSaveRow = useCallback(
    (id: string) => {
      const ticket = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (!ticket) return;
      updateBonLivraisonMutation(
        { ticketId: id, ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        {
          onSuccess: () => {
            setEditedTickets((prev) => { const m = new Map(prev); m.delete(id); return m; });
            handleCancelEditRow(id);
          },
        },
      );
    },
    [editedTickets, ticketsData, restaurants, updateBonLivraisonMutation, handleCancelEditRow],
  );

  const getDisplayTicket = useCallback(
    (ticket: Ticket): Ticket => {
      if (!editingIds.has(ticket.id)) return ticket;
      return editedTickets.get(ticket.id) ?? ticket;
    },
    [editingIds, editedTickets],
  );

  return {
    editingIds,
    editedTickets,
    setEditedTickets,
    handleEditRow,
    handleCancelEditRow,
    handleTicketChange,
    handleTicketPatch,
    handleSaveRow,
    getDisplayTicket,
  };
}
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Committer**

```powershell
rtk git add features/tickets/hooks/use-ticket-editing.ts
rtk git commit -m "feat(tickets): add use-ticket-editing hook"
```

---

### Task 6 : Créer `use-new-tickets.ts`

**Fichiers :**
- Créer : `features/tickets/hooks/use-new-tickets.ts`

- [ ] **Créer le hook**

```ts
// features/tickets/hooks/use-new-tickets.ts
import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';

interface Option { value: string; label: string }

interface UseNewTicketsParams {
  restaurants: Restaurant[];
  livreurOptions: Option[];
  restaurantOptions: Option[];
  createBonLivraisonMutation: (
    vars: { ticket: Ticket; restaurant?: { typeCommission: string; commission: number } },
    callbacks?: { onSuccess?: () => void },
  ) => void;
}

export function useNewTickets({ restaurants, livreurOptions, restaurantOptions, createBonLivraisonMutation }: UseNewTicketsParams) {
  const [newTickets, setNewTickets] = useState<Ticket[]>([]);

  // Insert bar state
  const [insertCount, setInsertCount] = useState<number>(1);
  const [insertLivreurId, setInsertLivreurId] = useState<string>('');
  const [insertRestaurantId, setInsertRestaurantId] = useState<string>('');
  const [insertDate, setInsertDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const newTicketIds = useMemo(() => new Set(newTickets.map((t) => t.id)), [newTickets]);

  const handleInsert = useCallback(() => {
    if (insertCount <= 0) return;
    const livreurLabel = livreurOptions.find((l) => l.value === insertLivreurId)?.label ?? '';
    const restaurantLabel = restaurantOptions.find((r) => r.value === insertRestaurantId)?.label ?? '';

    const tickets: Ticket[] = Array.from({ length: insertCount }).map(() => ({
      id: uuidv4(),
      reference: '',
      livreurId: insertLivreurId,
      livreur: livreurLabel,
      restaurantId: insertRestaurantId,
      restaurant: restaurantLabel,
      montantCommande: '',
      montantLivraison: '',
      coutLivraison: '',
      date: insertDate || new Date().toISOString().split('T')[0],
      heure: new Date().toLocaleTimeString('fr-FR'),
      isNew: true,
      isEditing: true,
      statut: 'TERMINE',
    }));

    setNewTickets((prev) => [...tickets, ...prev]);
  }, [insertCount, insertLivreurId, insertRestaurantId, insertDate, livreurOptions, restaurantOptions]);

  const handleSaveNewTicket = useCallback(
    (id: string) => {
      const ticket = newTickets.find((t) => t.id === id);
      if (!ticket) return;
      createBonLivraisonMutation(
        { ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        { onSuccess: () => setNewTickets((prev) => prev.filter((t) => t.id !== id)) },
      );
    },
    [newTickets, createBonLivraisonMutation, restaurants],
  );

  const handleCancelNewTicket = useCallback((id: string) => {
    setNewTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleNewTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      setNewTickets((prev) =>
        prev.map((t) => (t.id === id ? applyTicketPatch(t, { [field]: value }, restaurants) : t)),
      );
    },
    [restaurants],
  );

  const handleNewTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      setNewTickets((prev) =>
        prev.map((t) => (t.id === id ? applyTicketPatch(t, patch, restaurants) : t)),
      );
    },
    [restaurants],
  );

  return {
    newTickets,
    newTicketIds,
    insertState: { insertCount, insertLivreurId, insertRestaurantId, insertDate, setInsertCount, setInsertLivreurId, setInsertRestaurantId, setInsertDate },
    handleInsert,
    handleSaveNewTicket,
    handleCancelNewTicket,
    handleNewTicketChange,
    handleNewTicketPatch,
  };
}
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Committer**

```powershell
rtk git add features/tickets/hooks/use-new-tickets.ts
rtk git commit -m "feat(tickets): add use-new-tickets hook with insert bar state"
```

---

### Task 7 : Mettre à jour `useTickets` pour intégrer `use-ticket-editing`

**Fichiers :**
- Modifier : `features/tickets/hooks/use-tickets.ts`

- [ ] **Remplacer le contenu de `use-tickets.ts`**

```ts
import { useMemo } from 'react';
import { useTicketFilters } from '@/features/tickets/hooks/use-ticket-filters';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';
import { useTicketsInfiniteQuery } from '@/features/tickets/queries/ticket-infinite.query';
import { useCreateBonLivraison, useDeleteBonLivraison, useUpdateBonLivraison } from '@/features/tickets/queries/tickets.mutation';
import { Restaurant } from '@/types/models';
import { useTicketEditing } from '@/features/tickets/hooks/use-ticket-editing';

export default function useTickets(restaurants: Restaurant[] = []) {
  const { filters, setFilter, resetFilters } = useTicketFilters();

  const currentSearchParams: ITicketParams = useMemo(() => ({
    page: filters.page,
    size: filters.size,
    search: filters.search,
    livreurId: filters.livreurId,
    restaurantId: filters.restaurantId,
    debut: filters.debut,
    fin: filters.fin,
  }), [filters]);

  const { data, isLoading, status, isFetching, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, hasNextPage, isError, error } =
    useTicketsInfiniteQuery(currentSearchParams);

  const { mutate: createBonLivraisonMutation, isPending: isCreatingBonLivraison } = useCreateBonLivraison();
  const { mutate: deleteBonLivraisonMutation, isPending: isDeletingBonLivraison } = useDeleteBonLivraison();
  const { mutate: updateBonLivraisonMutation, isPending: isUpdatingBonLivraison } = useUpdateBonLivraison();

  const ticketsRaw = useMemo(
    () => [...(data?.pages.flatMap((page) => page.content.map(bonLivraisonToTicket)) || [])],
    [data],
  );

  const totalItems = data?.pages[0]?.totalElements || 0;

  const editing = useTicketEditing({
    restaurants,
    ticketsData: ticketsRaw,
    updateBonLivraisonMutation,
  });

  return {
    filters,
    setFilter,
    resetFilters,
    ticketsData: ticketsRaw,
    isLoading,
    isError,
    error,
    infiniteState: { status, isFetching, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, hasNextPage, totalItems },
    mutations: { createBonLivraisonMutation, isCreatingBonLivraison, deleteBonLivraisonMutation, isDeletingBonLivraison, updateBonLivraisonMutation, isUpdatingBonLivraison },
    editing,
  };
}
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur (des erreurs peuvent apparaître dans `ticket-table.tsx` qui utilise encore l'ancienne API — c'est attendu, elles seront corrigées à la Task 8).

- [ ] **Committer**

```powershell
rtk git add features/tickets/hooks/use-tickets.ts
rtk git commit -m "refactor(tickets): integrate use-ticket-editing into useTickets"
```

---

### Task 8 : Mettre à jour `TicketTable` pour utiliser les nouveaux hooks

**Fichiers :**
- Modifier : `components/tickets/table/ticket-table.tsx`

- [ ] **Remplacer le contenu de `ticket-table.tsx`**

```tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { toast } from 'react-toastify';
import { Package } from 'lucide-react';

import { Restaurant, User } from '@/types/models';
import { Ticket } from '@/types/bon-livraison.model';
import useTickets from '@/features/tickets/hooks/use-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useNewTickets } from '@/features/tickets/hooks/use-new-tickets';
import { useTicketAuthentication } from '@/features/tickets/hooks/use-ticket-authentication';
import StatsSection from '@/components/tickets/stats-section';
import TicketTabLivreur from '@/components/tickets/tabs/ticket-tab-livreur';
import { TicketTableFilters } from './ticket-table-filters';
import { TicketTableActions } from './ticket-table-actions';
import { TicketTableExportButton } from './ticket-table-export-button';
import { createTicketColumns, TicketColumnMeta } from './ticket-table-columns';
import ConfirmModal from '@/components/ui/confirm-modal';

interface TicketTableProps {
  restaurants: Restaurant[];
  profile: User | null;
}

export function TicketTable({ restaurants, profile }: TicketTableProps) {
  const {
    filters,
    setFilter,
    ticketsData,
    isLoading,
    infiniteState,
    mutations: { createBonLivraisonMutation, isCreatingBonLivraison, deleteBonLivraisonMutation, isDeletingBonLivraison, isUpdatingBonLivraison },
    editing,
  } = useTickets(restaurants);

  const { livreurs } = useLivreurs();
  const ability = useAbility();

  const validLivreurs = useMemo(() => livreurs.filter((l) => l.prenoms && l.nom), [livreurs]);
  const livreurOptions = useMemo(() => validLivreurs.map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const {
    newTickets,
    newTicketIds,
    handleSaveNewTicket,
    handleCancelNewTicket,
    handleNewTicketChange,
    handleNewTicketPatch,
  } = useNewTickets({ restaurants, livreurOptions, restaurantOptions, createBonLivraisonMutation });

  const { authenticatedIds, handleAuthentifier } = useTicketAuthentication();

  const permissions = useMemo(() => ({
    canCreate: ability.can('create', 'Ticket'),
    canUpdate: ability.can('update', 'Ticket'),
    canDelete: ability.can('delete', 'Ticket'),
    canAuthentifier: ability.can('authentifier', 'Ticket'),
  }), [ability]);

  const [ticketsToDelete, setTicketsToDelete] = useState<string[] | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const activeTab = filters.tab;
  const observerTarget = useInfiniteScroll(infiniteState.fetchNextPage, infiniteState.hasNextPage);
  const allTickets = useMemo(() => [...newTickets, ...ticketsData], [newTickets, ticketsData]);
  const columns = useMemo(() => createTicketColumns(), []);

  const handleDeleteRow = useCallback((id: string) => setTicketsToDelete([id]), []);

  const handleTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      if (newTicketIds.has(id)) handleNewTicketChange(id, field, value);
      else editing.handleTicketChange(id, field, value);
    },
    [newTicketIds, handleNewTicketChange, editing],
  );

  const handleTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      if (newTicketIds.has(id)) handleNewTicketPatch(id, patch);
      else editing.handleTicketPatch(id, patch);
    },
    [newTicketIds, handleNewTicketPatch, editing],
  );

  const tableMeta: TicketColumnMeta = useMemo(
    () => ({
      livreurOptions,
      restaurantOptions,
      editingIds: editing.editingIds,
      editedTickets: editing.editedTickets,
      newTicketIds,
      permissions,
      authenticatedIds,
      onTicketChange: handleTicketChange,
      onTicketPatch: handleTicketPatch,
      onSaveNew: handleSaveNewTicket,
      onSaveEdit: editing.handleSaveRow,
      onCancelNew: handleCancelNewTicket,
      onCancelEdit: editing.handleCancelEditRow,
      onEditRow: editing.handleEditRow,
      onDeleteRow: handleDeleteRow,
      onAuthentifier: handleAuthentifier,
      isSavingNew: isCreatingBonLivraison,
      isSavingEdit: isUpdatingBonLivraison,
      getDisplayTicket: editing.getDisplayTicket,
    }),
    [
      livreurOptions, restaurantOptions, editing, newTicketIds, permissions,
      authenticatedIds, handleTicketChange, handleTicketPatch, handleSaveNewTicket,
      handleCancelNewTicket, handleDeleteRow, handleAuthentifier, isCreatingBonLivraison, isUpdatingBonLivraison,
    ],
  );

  const table = useReactTable({
    data: allTickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    meta: tableMeta,
    getRowId: (row) => row.id,
  });

  const selectedRowIds = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.id)
    .filter((id) => !newTicketIds.has(id));

  const colsCount = table.getAllColumns().length;

  const handleConfirmDelete = useCallback(() => {
    if (!ticketsToDelete || ticketsToDelete.length === 0) return;
    for (const id of ticketsToDelete) {
      deleteBonLivraisonMutation(id, {
        onSuccess: () => { if (ticketsToDelete.length === 1) toast.success('Le ticket a été supprimé avec succès.'); },
        onError: () => toast.error('Erreur lors de la suppression du ticket.'),
      });
    }
    setRowSelection({});
    setTicketsToDelete(null);
  }, [ticketsToDelete, deleteBonLivraisonMutation]);

  const handleDeleteRows = useCallback(() => {
    if (selectedRowIds.length === 0) { toast.warning('Aucune ligne sélectionnée'); return; }
    setTicketsToDelete(Array.from(selectedRowIds));
  }, [selectedRowIds]);

  return (
    <div className="min-h-screen p-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mes tickets</h1>
            <p className="text-xs sm:text-sm text-gray-500">Système de suivi des tickets de livraison</p>
          </div>
        </div>
      </div>

      <StatsSection />

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setFilter('tab', 'tous')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'tous' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Tous les Tickets
          </button>
          <button
            onClick={() => setFilter('tab', 'livreur')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'livreur' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Par Livreur
          </button>
        </div>

        {activeTab === 'tous' && (
          <div className="p-4">
            <TicketTableFilters
              search={filters.search}
              livreurId={filters.livreurId}
              restaurantId={filters.restaurantId}
              debut={filters.debut}
              fin={filters.fin}
              livreurOptions={livreurOptions}
              restaurantOptions={restaurantOptions}
              onFilterChange={setFilter}
            />
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-600">Total: {infiniteState.totalItems} ticket(s)</p>
              <TicketTableExportButton filters={filters} totalItems={infiniteState.totalItems} isDisabled={isLoading} />
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="max-h-[420px] overflow-y-auto">
                <Table isStriped>
                  <TableHeader>
                    {table.getFlatHeaders().map((header) => (
                      <TableColumn key={header.id} className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody emptyContent={isLoading ? 'Chargement des tickets...' : 'Aucun ticket trouvé.'}>
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            {Array.from({ length: colsCount }).map((_, j) => (
                              <TableCell key={`skeleton-cell-${j}`} className="h-12">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={`${row.getIsSelected() ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="px-2 py-1 text-xs whitespace-nowrap">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
                <div className="h-0.5" ref={observerTarget}>
                  {infiniteState.isFetchingNextPage && <p className="text-xs text-gray-500 w-full text-center py-2">Chargement des données...</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'livreur' && <TicketTabLivreur />}
      </div>

      {activeTab !== 'livreur' && (
        <TicketTableActions
          ticketsData={ticketsData}
          selectedRows={selectedRowIds}
          permissions={permissions}
          isDeletingBonLivraison={isDeletingBonLivraison}
          onDeleteRows={handleDeleteRows}
        />
      )}

      <ConfirmModal
        isOpen={ticketsToDelete !== null}
        onClose={() => setTicketsToDelete(null)}
        title={ticketsToDelete?.length === 1 ? 'Supprimer le ticket' : `Supprimer ${ticketsToDelete?.length ?? 0} ticket(s)`}
        isLoading={isDeletingBonLivraison}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: () => setTicketsToDelete(null) },
          { label: 'Supprimer', color: 'danger', onPress: handleConfirmDelete },
        ]}
      >
        {ticketsToDelete?.length === 1
          ? 'Confirmez-vous la suppression définitive de ce ticket ? Cette action est irréversible.'
          : `Confirmez-vous la suppression de ${ticketsToDelete?.length ?? 0} ticket(s) ? Cette action est irréversible.`}
      </ConfirmModal>
    </div>
  );
}
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Vérifier visuellement** — `http://localhost:3000/tickets` : la table s'affiche, les filtres fonctionnent, on peut éditer et supprimer un ticket.

- [ ] **Committer**

```powershell
rtk git add components/tickets/table/ticket-table.tsx
rtk git commit -m "refactor(tickets): TicketTable uses feature hooks, ~200 lines"
```

---

## Phase 3 — Insert bar au niveau page + CASL

### Task 9 : Mettre à jour `ability.ts` pour les permissions Ticket

**Fichiers :**
- Modifier : `lib/casl/ability.ts`

- [ ] **Ajouter `"CENTRALE D'APPEL"` dans `SESSION_ROLE_ALIASES`**

Dans le bloc `SESSION_ROLE_ALIASES`, ajouter :

```ts
"CENTRALE D'APPEL": 'STANDARD',
```

- [ ] **Mettre à jour les règles `STANDARD` — remplacer `manage Ticket` par `create + read`**

Dans le `case 'STANDARD':`, remplacer :
```ts
can('manage', 'Ticket');
```
par :
```ts
can('create', 'Ticket');
can('read', 'Ticket');
```

- [ ] **Mettre à jour les règles `COMPTABLE` — remplacer `manage Ticket` par `create + read`**

Dans le `case 'COMPTABLE':`, remplacer :
```ts
can('manage', 'Ticket');
```
par :
```ts
can('create', 'Ticket');
can('read', 'Ticket');
```

- [ ] **Ajouter `create Ticket` pour `BUSINESS_DEVELOPER`**

Dans le `case 'BUSINESS_DEVELOPER':`, ajouter après `can('read', ['Livreur', 'Restaurant', 'Ticket'])` :
```ts
can('create', 'Ticket');
```

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Committer**

```powershell
rtk git add lib/casl/ability.ts
rtk git commit -m "feat(casl): add granular Ticket permissions per role"
```

---

### Task 10 : Créer `TicketInsertBar` et mettre à jour la page

**Fichiers :**
- Créer : `components/tickets/table/ticket-insert-bar.tsx`
- Modifier : `app/(protected)/tickets/page.tsx`

- [ ] **Créer `ticket-insert-bar.tsx`**

```tsx
'use client';

import React from 'react';
import Select from 'react-select';
import { Plus } from 'lucide-react';

interface Option { value: string; label: string }

interface InsertState {
  insertCount: number;
  insertLivreurId: string;
  insertRestaurantId: string;
  insertDate: string;
  setInsertCount: (v: number) => void;
  setInsertLivreurId: (v: string) => void;
  setInsertRestaurantId: (v: string) => void;
  setInsertDate: (v: string) => void;
}

interface TicketInsertBarProps {
  livreurOptions: Option[];
  restaurantOptions: Option[];
  insertState: InsertState;
  onInsert: () => void;
  canCreate: boolean;
}

export function TicketInsertBar({ livreurOptions, restaurantOptions, insertState, onInsert, canCreate }: TicketInsertBarProps) {
  const { insertCount, insertLivreurId, insertRestaurantId, insertDate, setInsertCount, setInsertLivreurId, setInsertRestaurantId, setInsertDate } = insertState;

  const selectStyles = {
    control: (base: object) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
    valueContainer: (base: object) => ({ ...base, height: '36px', padding: '0 8px' }),
    indicatorsContainer: (base: object) => ({ ...base, height: '36px' }),
  };

  return (
    <div className="w-full my-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <div className="w-full">
          <label className="block text-xs mb-1">Restaurant</label>
          <Select
            options={restaurantOptions}
            value={restaurantOptions.find((o) => o.value === insertRestaurantId) ?? null}
            onChange={(opt) => setInsertRestaurantId(opt?.value ?? '')}
            placeholder="Restaurant"
            isClearable
            className="text-xs w-full"
            classNamePrefix="react-select"
            styles={selectStyles}
          />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1">Livreur</label>
          <Select
            options={livreurOptions}
            value={livreurOptions.find((o) => o.value === insertLivreurId) ?? null}
            onChange={(opt) => setInsertLivreurId(opt?.value ?? '')}
            placeholder="Livreur"
            isClearable
            className="text-xs w-full"
            classNamePrefix="react-select"
            styles={selectStyles}
          />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1">Date</label>
          <input type="date" value={insertDate} onChange={(e) => setInsertDate(e.target.value)} className="h-9 w-full px-2 text-xs border border-gray-300 rounded-md" />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1">Nb lignes</label>
          <input
            type="number"
            min={1}
            value={insertCount}
            onChange={(e) => setInsertCount(Number(e.target.value))}
            className="h-9 w-full px-2 text-xs text-center border border-gray-300 rounded-md"
          />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1 invisible">Action</label>
          <button
            disabled={!canCreate}
            onClick={onInsert}
            className="h-9 w-full bg-green-500 text-white rounded flex items-center justify-center gap-1 text-xs hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" /> Insérer
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Mettre à jour `app/(protected)/tickets/page.tsx`**

La page est un Server Component. `TicketInsertBar` et `useNewTickets` sont côté client. Créer un wrapper client `TicketPageClient` qui monte les deux :

```tsx
// app/(protected)/tickets/page.tsx
import { getProfile } from '@/src/actions/users.actions';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { TicketTable } from '@/components/tickets/table';
import { TicketPageClient } from '@/components/tickets/ticket-page-client';

export default async function TicketsPage() {
  const profile = await getProfile();
  const restaurants = await getAllRestaurants();

  return <TicketPageClient restaurants={restaurants} profile={profile} />;
}
```

- [ ] **Créer `components/tickets/ticket-page-client.tsx`**

```tsx
'use client';

import React, { useMemo } from 'react';
import { Restaurant, User } from '@/types/models';
import { TicketTable } from '@/components/tickets/table';
import { TicketInsertBar } from '@/components/tickets/table/ticket-insert-bar';
import { useNewTickets } from '@/features/tickets/hooks/use-new-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import { useCreateBonLivraison } from '@/features/tickets/queries/tickets.mutation';

interface TicketPageClientProps {
  restaurants: Restaurant[];
  profile: User | null;
}

export function TicketPageClient({ restaurants, profile }: TicketPageClientProps) {
  const ability = useAbility();
  const { livreurs } = useLivreurs();
  const { mutate: createBonLivraisonMutation } = useCreateBonLivraison();

  const validLivreurs = useMemo(() => livreurs.filter((l) => l.prenoms && l.nom), [livreurs]);
  const livreurOptions = useMemo(() => validLivreurs.map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const { insertState, handleInsert } = useNewTickets({
    restaurants,
    livreurOptions,
    restaurantOptions,
    createBonLivraisonMutation,
  });

  return (
    <>
      <TicketInsertBar
        livreurOptions={livreurOptions}
        restaurantOptions={restaurantOptions}
        insertState={insertState}
        onInsert={handleInsert}
        canCreate={ability.can('create', 'Ticket')}
      />
      <TicketTable restaurants={restaurants} profile={profile} />
    </>
  );
}
```

> **Note :** `useNewTickets` est maintenant instancié dans `TicketPageClient`. `TicketTable` n'a plus connaissance de l'état d'insertion. Les `newTickets` et `newTicketIds` doivent être passés en props à `TicketTable` ou partagés via contexte. Option la plus simple : passer `newTickets`, `newTicketIds`, et les handlers concernés en props additionnelles à `TicketTable`. Mettre à jour la signature `TicketTableProps` en conséquence et retirer `useNewTickets` de `TicketTable`.

- [ ] **Mettre à jour `TicketTableProps` dans `ticket-table.tsx`** pour recevoir les props d'insertion :

```ts
interface TicketTableProps {
  restaurants: Restaurant[];
  profile: User | null;
  newTickets: Ticket[];
  newTicketIds: Set<string>;
  onSaveNewTicket: (id: string) => void;
  onCancelNewTicket: (id: string) => void;
  onNewTicketChange: (id: string, field: keyof Ticket, value: string) => void;
  onNewTicketPatch: (id: string, patch: Partial<Ticket>) => void;
}
```

Retirer `useNewTickets` de `TicketTable` et utiliser directement les props.

- [ ] **Vérifier TypeScript**

```powershell
rtk tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Vérifier visuellement** — `http://localhost:3000/tickets` : la barre d'insertion apparaît au-dessus du tableau, on peut insérer un nouveau ticket, il s'affiche dans la table.

- [ ] **Committer**

```powershell
rtk git add components/tickets/table/ticket-insert-bar.tsx components/tickets/ticket-page-client.tsx app/(protected)/tickets/page.tsx components/tickets/table/ticket-table.tsx
rtk git commit -m "feat(tickets): move insert bar to page level, TicketTable becomes presentational"
```

---

## Vérification finale

- [ ] **Build complet**

```powershell
rtk next build
```

Attendu : build sans erreur.

- [ ] **Parcours utilisateur complet** sur `http://localhost:3000/tickets` :
  - La barre d'insertion est visible et fonctionnelle
  - Insérer 2 tickets → ils apparaissent en haut de la table
  - Modifier un ticket existant → sauvegarder
  - Supprimer un ticket unitaire → `ConfirmModal` s'ouvre
  - Sélectionner plusieurs tickets → supprimer → `ConfirmModal` affiche le bon compte
  - Changer d'onglet vers "Par Livreur" → fonctionne
