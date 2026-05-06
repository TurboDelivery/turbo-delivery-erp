# Verrouillage V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page "Verrouillage V2" dans la sidebar sous "Validation des tickets" — liste les tickets V1_VALIDE avec validation V2 et rejet fraude par ligne.

**Architecture:** Nouveaux composants dans `features/validation-tickets/verrouillage-v2/` (fichiers existants non touchés — ils servent la page Verification V1). Table react-table avec DataTable UI, stats cards, dialog motif rejet, bottom action bar. Mutations via server actions (`'use server'`) + TanStack Query.

**Tech Stack:** Next.js 14 App Router, TanStack Query v4, TanStack Table v8, DataTable (components/ui/data-table.tsx), Shadcn Dialog, `formatCFA` (@/src/actions/bonLivraison.mapper), `auth()` next-auth v5, `apiClientHttp` service backend.

---

## File Map

**Create:**
- `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-content.tsx` — orchestrateur principal (client)
- `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-stats.tsx` — 4 stat cards
- `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-columns.tsx` — ColumnDef séparées
- `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-table.tsx` — wrapper DataTable
- `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-footer.tsx` — bottom action bar
- `features/validation-tickets/verrouillage-v2/components/reject-motif-dialog.tsx` — dialog motif rejet
- `features/validation-tickets/verrouillage-v2/hooks/use-verrouillage-v2-content.ts` — hook état page V2

**Modify:**
- `features/tickets/request/tickets.request.ts` — ajouter `validerV2Request`
- `src/actions/bon-commande.action.ts` — ajouter `validerV2Ticket` server action
- `features/validation-tickets/verrouillage-v2/queries/tickets-v2.mutation.ts` — ajouter `useValiderV2Mutation` + `useRejeterV2FraudeMutation`
- `app/(protected)/validation-tickets/verrouillage-v2/page.tsx` — brancher `VerrouillageV2Content`
- `config/menu-data.tsx` — ajouter entrée sidebar

**Do NOT touch:**
- `verification-v1-content.tsx`, `TicketReadyList.tsx`, `TicketLockedList.tsx`, `TicketReadyCard.tsx`
- `use-verrouillage-v2.ts` (hook existant pour page V1)
- `tickets-v2-list.query.ts` — `useTicketsV1ValideQuery` déjà implémenté, réutilisé tel quel

---

### Task 1: Entrée sidebar + route page

**Files:**
- Modify: `config/menu-data.tsx`
- Modify: `app/(protected)/validation-tickets/verrouillage-v2/page.tsx`

- [ ] **Step 1: Ajouter "Verrouillage V2" dans menu-data.tsx**

Dans `config/menu-data.tsx`, trouver l'objet qui contient `title: 'Validation des tickets'` et ajouter l'enfant après 'Régularisation' :

```typescript
{ icon: Lock, title: 'Verrouillage V2', path: '/validation-tickets/verrouillage-v2', can: { action: 'manage', subject: 'Ticket' } },
```

Le bloc children doit ressembler à :
```typescript
children: [
  { icon: Lock, title: 'Verification V1', path: '/validation-tickets/verification-v1', can: { action: 'manage', subject: 'Ticket' } },
  { icon: Lock, title: 'Régularisation', path: '/validation-tickets/regularisation', can: { action: 'manage', subject: 'Ticket' } },
  { icon: Lock, title: 'Verrouillage V2', path: '/validation-tickets/verrouillage-v2', can: { action: 'manage', subject: 'Ticket' } },
],
```

- [ ] **Step 2: Brancher la page (placeholder)**

Remplacer `app/(protected)/validation-tickets/verrouillage-v2/page.tsx` (actuellement `<div></div>`) :

```typescript
import { VerrouillageV2Content } from '@/features/validation-tickets/verrouillage-v2/components/verrouillage-v2-content';

export const dynamic = 'force-dynamic';

export default function VerrouillageV2Page() {
  return <VerrouillageV2Content />;
}
```

- [ ] **Step 3: Commit**
```bash
git add config/menu-data.tsx app/(protected)/validation-tickets/verrouillage-v2/page.tsx
git commit -m "feat(verrouillage-v2): add sidebar entry and page route"
```

---

### Task 2: Backend request + server action validerV2

**Files:**
- Modify: `features/tickets/request/tickets.request.ts`
- Modify: `src/actions/bon-commande.action.ts`

- [ ] **Step 1: Ajouter `validerV2Request` dans tickets.request.ts**

Après `validerV1Request` (ligne ~104), ajouter :

```typescript
export async function validerV2Request(ticketId: string, userId: string): Promise<void> {
  return await apiClientHttp.request<void>({
    endpoint: `/api/tickets/${ticketId}/valider-v2`,
    method: 'POST',
    service: 'backend',
    config: { headers: { 'X-User-Id': userId } },
  });
}
```

- [ ] **Step 2: Ajouter l'import dans bon-commande.action.ts**

Dans `src/actions/bon-commande.action.ts`, mettre à jour la ligne d'import pour inclure `validerV2Request` :

```typescript
import { authentifierTicketRequest, validerV1Request, validerV2Request, approuverTicketRequest, rejeterFraudeRequest } from '@/features/tickets/request/tickets.request';
```

- [ ] **Step 3: Ajouter `validerV2Ticket` server action dans bon-commande.action.ts**

Après `validerV1Ticket` (autour de la ligne 232), ajouter :

```typescript
/**
 * Valider V2 un ticket (Responsable V&A — verrouillage irréversible)
 */
export async function validerV2Ticket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await validerV2Request(ticketId, userId);
    return { success: true, message: 'Ticket validé V2 avec succès' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation V2 du ticket');
  }
}
```

- [ ] **Step 4: Commit**
```bash
git add features/tickets/request/tickets.request.ts src/actions/bon-commande.action.ts
git commit -m "feat(verrouillage-v2): add validerV2Request and validerV2Ticket server action"
```

---

### Task 3: Mutations TanStack Query pour V2

**Files:**
- Modify: `features/validation-tickets/verrouillage-v2/queries/tickets-v2.mutation.ts`

- [ ] **Step 1: Ajouter les imports et les deux nouvelles mutations**

Le fichier actuel contient `useValiderV1Mutation`. Ajouter après :

```typescript
import { validerV1Ticket, validerV2Ticket, rejeterTicketPourFraude } from '@/src/actions/bon-commande.action';
```

Remplacer l'import existant `import { validerV1Ticket } from '@/src/actions/bon-commande.action';` par la ligne ci-dessus.

Ensuite ajouter les deux nouvelles mutations à la fin du fichier :

```typescript
export const useValiderV2Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const result = await validerV2Ticket(ticketId);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket validé V2.');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation V2', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRejeterV2FraudeMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const result = await rejeterTicketPourFraude(id, motif);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket rejeté pour fraude.');
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/queries/tickets-v2.mutation.ts
git commit -m "feat(verrouillage-v2): add useValiderV2Mutation and useRejeterV2FraudeMutation"
```

---

### Task 4: Dialog motif rejet

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/components/reject-motif-dialog.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectMotifDialogProps {
  open: boolean;
  ticketId: string | null;
  isRejecting: boolean;
  onConfirm: (id: string, motif: string) => void;
  onClose: () => void;
}

export function RejectMotifDialog({ open, ticketId, isRejecting, onConfirm, onClose }: RejectMotifDialogProps) {
  const [motif, setMotif] = useState('');
  const canConfirm = motif.trim().length >= 30;

  const handleConfirm = () => {
    if (!ticketId || !canConfirm) return;
    onConfirm(ticketId, motif.trim());
  };

  const handleClose = () => {
    setMotif('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Motif de rejet pour fraude</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motif">
            Motif <span className="text-gray-400 text-xs">(min. 30 caractères)</span>
          </Label>
          <Textarea
            id="motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Décrivez le motif du rejet..."
            rows={4}
          />
          <p className="text-xs text-gray-400">{motif.trim().length} / 30 caractères minimum</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRejecting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm || isRejecting}>
            {isRejecting ? 'Rejet en cours...' : 'Confirmer le rejet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/components/reject-motif-dialog.tsx
git commit -m "feat(verrouillage-v2): add RejectMotifDialog component"
```

---

### Task 5: Stats cards

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-stats.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
'use client';

import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface VerrouillageV2StatsProps {
  tickets: BonLivraisonTerminee[];
  ticketsPending: number;
}

export function VerrouillageV2Stats({ tickets, ticketsPending }: VerrouillageV2StatsProps) {
  const totalBrut = tickets.reduce((sum, t) => sum + (t.coutCommande ?? 0), 0);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tickets validés</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{tickets.length}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total brut</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCFA(totalBrut)}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Anomalies résolues</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">—</p>
      </div>
      <div className="rounded-xl border border-yellow-300 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Statut créneau en attente</p>
        <p className="mt-1 text-2xl font-semibold text-yellow-600">{ticketsPending}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/components/verrouillage-v2-stats.tsx
git commit -m "feat(verrouillage-v2): add VerrouillageV2Stats component"
```

---

### Task 6: Colonnes react-table (fichier séparé)

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-columns.tsx`

- [ ] **Step 1: Créer les définitions de colonnes**

Pattern identique à `facture-table-columns.tsx` — tableau plat de `ColumnDef<BonLivraisonTerminee>[]`, composant action mémoïsé dans le même fichier.

```typescript
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface RowActionsProps {
  ticket: BonLivraisonTerminee;
  isValidating: boolean;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

const RowActions = memo(function RowActions({ ticket, isValidating, onValidate, onReject }: RowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
        onClick={() => onValidate(ticket.commandeId)}
        disabled={isValidating}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Valider V2
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 px-2 text-xs"
        onClick={() => onReject(ticket.commandeId)}
        disabled={isValidating}
      >
        <XCircle className="h-3.5 w-3.5 mr-1" />
        Rejeter
      </Button>
    </div>
  );
});

export function buildVerrouillageV2Columns(
  onValidate: (id: string) => void,
  onReject: (id: string) => void,
  validatingId: string | null,
): ColumnDef<BonLivraisonTerminee>[] {
  return [
    {
      accessorKey: 'reference',
      header: 'TICKET',
      enableSorting: false,
    },
    {
      accessorKey: 'livreur',
      header: 'LIVREUR',
      enableSorting: false,
    },
    {
      accessorKey: 'restaurant',
      header: 'PARTENAIRE',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-blue-500">{row.original.restaurant}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      enableSorting: false,
    },
    {
      accessorKey: 'coutLivraison',
      header: 'COMMISSION',
      enableSorting: false,
      cell: ({ row }) => <span>{formatCFA(row.original.coutLivraison)}</span>,
    },
    {
      accessorKey: 'nomZone',
      header: 'ZONE',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {row.original.nomZone ?? 'VERTE'}
        </span>
      ),
    },
    {
      id: 'v1ValidePar',
      header: 'V1 PAR',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-gray-700">{(row.original as any).v1ValidePar ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          ticket={row.original}
          isValidating={validatingId === row.original.commandeId}
          onValidate={onValidate}
          onReject={onReject}
        />
      ),
    },
  ];
}
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/components/verrouillage-v2-columns.tsx
git commit -m "feat(verrouillage-v2): add column definitions"
```

---

### Task 7: Table component

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-table.tsx`

- [ ] **Step 1: Créer le wrapper DataTable**

```typescript
'use client';

import { useMemo } from 'react';
import DataTable from '@/components/ui/data-table';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { buildVerrouillageV2Columns } from './verrouillage-v2-columns';

interface VerrouillageV2TableProps {
  tickets: BonLivraisonTerminee[];
  validatingId: string | null;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

export function VerrouillageV2Table({ tickets, validatingId, onValidate, onReject }: VerrouillageV2TableProps) {
  const columns = useMemo(
    () => buildVerrouillageV2Columns(onValidate, onReject, validatingId),
    [onValidate, onReject, validatingId],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">Récapitulatif final</p>
          <p className="text-xs text-gray-400">À vérifier avant verrouillage définitif</p>
        </div>
        <p className="text-xs text-gray-500">{tickets.length} ligne{tickets.length > 1 ? 's' : ''}</p>
      </div>
      <DataTable.Root columns={columns} data={tickets}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable.Root>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/components/verrouillage-v2-table.tsx
git commit -m "feat(verrouillage-v2): add VerrouillageV2Table component"
```

---

### Task 8: Footer action bar

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-footer.tsx`

- [ ] **Step 1: Créer le footer**

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { FileText, Lock } from 'lucide-react';

interface VerrouillageV2FooterProps {
  ticketCount: number;
  isValidating: boolean;
  onValidateAll: () => void;
}

export function VerrouillageV2Footer({ ticketCount, isValidating, onValidateAll }: VerrouillageV2FooterProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-orange-700">Action critique — Verrouillage irréversible</p>
        <p className="text-xs text-orange-500 mt-0.5">
          Une fois verrouillé, tout ticket pour ce créneau passera en PENDING_APPROBATION et requerra une approbation explicite.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Exporter PDF
        </Button>
        <Button
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          disabled={ticketCount === 0 || isValidating}
          onClick={onValidateAll}
        >
          <Lock className="h-4 w-4" />
          Valider V2 et Verrouiller le créneau
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/components/verrouillage-v2-footer.tsx
git commit -m "feat(verrouillage-v2): add VerrouillageV2Footer component"
```

---

### Task 9: Hook état page V2

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/hooks/use-verrouillage-v2-content.ts`

- [ ] **Step 1: Créer le hook**

Note : NE PAS modifier `use-verrouillage-v2.ts` (existant, sert la page V1). Ce fichier est nouveau.

```typescript
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTicketsV1ValideQuery } from '../queries/tickets-v2-list.query';
import { useValiderV2Mutation, useRejeterV2FraudeMutation } from '../queries/tickets-v2.mutation';
import { useCreneauActifQuery } from '@/features/creneaux/queries/creneau.query';

export function useVerrouillageV2Content() {
  const { data, isLoading } = useTicketsV1ValideQuery();
  const { data: creneauActif } = useCreneauActifQuery();
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const { mutate: validerV2, isPending: isValidating } = useValiderV2Mutation();
  const { mutate: rejeterFraude, isPending: isRejecting } = useRejeterV2FraudeMutation();

  const tickets = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );

  const handleValidate = useCallback(
    (id: string) => {
      setValidatingId(id);
      validerV2(id, { onSettled: () => setValidatingId(null) });
    },
    [validerV2],
  );

  const handleReject = useCallback(
    (id: string, motif: string) => {
      rejeterFraude({ id, motif }, { onSuccess: () => setRejectDialogId(null) });
    },
    [rejeterFraude],
  );

  const handleValidateAll = useCallback(() => {
    tickets.forEach((t) => validerV2(t.commandeId));
  }, [tickets, validerV2]);

  return {
    tickets,
    isLoading,
    validatingId,
    isValidating,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    creneauActif,
    handleValidate,
    handleReject,
    handleValidateAll,
  };
}
```

- [ ] **Step 2: Commit**
```bash
git add features/validation-tickets/verrouillage-v2/hooks/use-verrouillage-v2-content.ts
git commit -m "feat(verrouillage-v2): add useVerrouillageV2Content hook"
```

---

### Task 10: Content orchestrator

**Files:**
- Create: `features/validation-tickets/verrouillage-v2/components/verrouillage-v2-content.tsx`

- [ ] **Step 1: Créer le composant orchestrateur**

```typescript
'use client';

import { VerrouillageV2Stats } from './verrouillage-v2-stats';
import { VerrouillageV2Table } from './verrouillage-v2-table';
import { VerrouillageV2Footer } from './verrouillage-v2-footer';
import { RejectMotifDialog } from './reject-motif-dialog';
import { useVerrouillageV2Content } from '../hooks/use-verrouillage-v2-content';

export function VerrouillageV2Content() {
  const {
    tickets,
    isLoading,
    validatingId,
    isValidating,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    creneauActif,
    handleValidate,
    handleReject,
    handleValidateAll,
  } = useVerrouillageV2Content();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Chargement des tickets...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="text-2xl font-bold text-red-600">Verrouillage V2 — Responsable V&A</h1>
        <p className="text-sm text-gray-500 mt-1">
          Étape 4 — Double passe complète et verrouillage <strong>irréversible</strong> du créneau.
        </p>
      </div>

      <VerrouillageV2Stats
        tickets={tickets}
        ticketsPending={creneauActif?.nbTicketsPending ?? 0}
      />

      <VerrouillageV2Table
        tickets={tickets}
        validatingId={validatingId}
        onValidate={handleValidate}
        onReject={setRejectDialogId}
      />

      <VerrouillageV2Footer
        ticketCount={tickets.length}
        isValidating={isValidating}
        onValidateAll={handleValidateAll}
      />

      <RejectMotifDialog
        open={rejectDialogId !== null}
        ticketId={rejectDialogId}
        isRejecting={isRejecting}
        onConfirm={handleReject}
        onClose={() => setRejectDialogId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit final**
```bash
git add features/validation-tickets/verrouillage-v2/components/verrouillage-v2-content.tsx
git commit -m "feat(verrouillage-v2): add VerrouillageV2Content orchestrator"
```

---

## Notes d'implémentation

- `useTicketsV1ValideQuery` retourne un `InfiniteQueryObserverResult` avec `data.pages[]` — chaque page a `.content: BonLivraisonTerminee[]`. Toujours aplatir avec `pages.flatMap(p => p.content)`.
- `BonLivraisonTerminee.commandeId` est l'identifiant à passer aux mutations (pas `reference`).
- Le champ `v1ValidePar` n'est pas encore dans le type TypeScript — la colonne utilise `(row.original as any).v1ValidePar` en attendant confirmation API.
- `formatCFA` inclut déjà "FCFA" dans sa sortie — ne pas ajouter " FCFA" après l'appel.
- `useInvalidateTicketsV2Query` invalide la clé `['tickets-v2']` — couvre les deux listes (V1 et AUTHENTIFIE) de la page V1 également.
