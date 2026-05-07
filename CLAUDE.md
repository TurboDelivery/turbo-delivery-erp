# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint via next lint
```

No test runner is configured.

## Environment Variables

Copy `env.local` and set the following:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_ERP_URL` | ERP backend service |
| `NEXT_PUBLIC_API_RESTO_URL` | Restaurant service |
| `NEXT_PUBLIC_API_DELIVERY_URL` | Livreur (delivery) service |
| `NEXT_PUBLIC_API_CLIENT_URL` | Customer service |
| `NEXT_PUBLIC_API_BACKEND_URL` | Generic backend service |
| `NEXTAUTH_URL` | NextAuth callback base URL |
| `AUTH_SECRET` | NextAuth signing secret |
| `NEXT_PUBLIC_SOCKET_HOST` | Socket.IO server |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps |

## Architecture

### Stack

Next.js 14 App Router · React 18 · TypeScript · TailwindCSS · HeroUI + Shadcn/Radix UI · TanStack Query v4 · React Hook Form + Zod · next-auth v5 (beta) · CASL · nuqs · Socket.IO client

### Routing

All authenticated pages live under `app/(protected)/`. The layout at `app/(protected)/layout.tsx` fetches the user profile server-side; if absent it redirects to `/auth`. It also mounts the `AbilityProvider` (CASL) and wraps children in `ProtectedPage`.

`middleware.ts` currently only redirects `/` → `/analystics`. Auth enforcement is done inside the layout via `getProfile()`.

### Feature Modules (`features/`)

Each domain feature is a self-contained directory. The canonical structure (see `features/restaurants/` as the reference):

```
features/<domain>/
  index.ts          ← barrel — only export from this file when consuming from outside the feature
  types/            ← TypeScript interfaces for the domain
  schemas/          ← Zod schemas + inferred DTOs + option constants
  apis/             ← Raw HTTP calls via apiClientHttp (used in server actions)
  actions/          ← Next.js Server Actions ('use server') — orchestrate API calls, called by queries
  filters/          ← nuqs parseAs* config objects (URL state shape)
  hooks/            ← Client hooks: useXxxFilters (URL state), useXxxList, useXxxTable
  queries/          ← TanStack Query hooks (useQuery / useMutation) + query key factories
  utils/            ← Pure helpers (mappers, option builders)
  mutations/        ← (some features) separate mutation hooks file
```

Not every feature has every layer; `features/price-list/` for example only has `hooks/`, `queries/`, `schemas/`.

**Import rule**: always import from `features/<domain>/index.ts` (or its path), never reach into sub-folders from outside the feature.

### API Client (`lib/api-client-http.tsx`)

`ApiClientHttp` is an Axios wrapper that resolves the correct base URL from the `service` parameter at call time:

| service | env var |
|---|---|
| `erp` | `NEXT_PUBLIC_API_ERP_URL` |
| `restaurant` | `NEXT_PUBLIC_API_RESTO_URL` |
| `livreur` | `NEXT_PUBLIC_API_DELIVERY_URL` |
| `client` | `NEXT_PUBLIC_API_CLIENT_URL` |
| `backend` | `NEXT_PUBLIC_API_BACKEND_URL` |

It reads the auth token from the NextAuth session (server-side via `auth()`, client-side via `getSession()`). A 401 response triggers an automatic logout via `/api/auth/logout`.

### Data Flow

```
URL params (nuqs) → useXxxFilters
                         ↓
              useXxxListQuery (TanStack Query)
                         ↓
              Server Action ('use server')
                         ↓
              apiClientHttp.request({ service, endpoint })
```

Mutations follow the same path: TanStack `useMutation` → Server Action → `apiClientHttp`.

### Component Layer (`components/`)

`components/` holds UI that is shared across features or specific to a page but not owning domain logic:

- `components/ui/` — Shadcn/Radix primitives (Button, Dialog, Input, DataTable, etc.)
- `components/layouts/` — Shell: Sidebar, Header, Footer, MainContainer
- `components/<domain>/` — Page-specific composed components (tables, stat cards, forms) that wire feature hooks to UI

Feature-specific components that are only used within one feature can also live inside `features/<domain>/components/`.

### Authorization (CASL)

Roles and permissions are defined in `lib/casl/ability.ts`. Roles: `STANDARD`, `OPS_MANAGER`, `COMPTABLE`, `DGA`, `DG`, `BUSINESS_DEVELOPER`. Use the `AbilityProvider` (already mounted in the protected layout) and the `useAbility` hook or `<Can>` component from `@casl/react` to guard UI elements.

### URL State (nuqs)

Filters (pagination, search, sort) are stored in the URL via `nuqs`. Each feature's `filters/` defines a `parseAs*` config. `useXxxFilters` wraps `useQueryStates` with that config and exposes typed setters.

### Finance Modules

Les modules finance sont dans `features/` : `charges`, `depenses`, `revenus`, `gestion-paiements`, `finance-dashboard`, `rapports-financiers`, `rapports-performance`, `validation-finance`, `analyse-rentabilite`.

### Legacy Code

`src/actions/` contains older server actions (bon-commande, livreurs, commandes…) that predate the `features/` architecture. Prefer the feature-module pattern for new work.

### Tables

**All data tables must use HeroUI components — never plain HTML `<table>` elements.**

Reference implementation: `components/finance/recouvrements/factures/facture-table.tsx`

#### Pattern

```
components/<domain>/<name>-table.tsx          ← HeroUI Table rendering
components/<domain>/<name>-table-columns.tsx  ← ColumnDef<T>[] array (separate file, always)
features/<domain>/hooks/use-<name>-table.ts   ← useReactTable instance + data fetching
```

#### Rules

- **Columns always in a separate file** (`*-table-columns.tsx`). Never inline `ColumnDef` arrays inside the table component or the hook.
- **Render with HeroUI**: import `Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination` from `@heroui/react`. Use `flexRender` from `@tanstack/react-table` to render cells.
- **Hook owns the table instance**: call `useReactTable({ data, columns, getCoreRowModel(), ... })` inside a `useXxxTable` hook, not in the component.
- **Pagination**: use the HeroUI `<Pagination>` component inside `Table`'s `bottomContent` prop. For infinite scroll, put the sentinel `<div ref={bottomRef}>` in `bottomContent` instead.
- **Loading skeletons**: loop `Array.from({ length: n })` inside `TableBody` when `isLoading`, rendering empty cells with a `animate-pulse` div.

#### Minimal example

```tsx
// *-table-columns.tsx
import { ColumnDef } from '@tanstack/react-table';
export const myColumns: ColumnDef<IMyType>[] = [
  { accessorKey: 'nom', header: 'Nom', cell: ({ row }) => <span>{row.original.nom}</span> },
];

// *-table.tsx
import { flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import useMyTable from '@/features/.../hooks/use-my-table';

export function MyTable() {
  const { table, isLoading } = useMyTable();
  return (
    <Table isStriped>
      <TableHeader>
        {table.getFlatHeaders().map(h => (
          <TableColumn key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="Aucun résultat">
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Tailwind

`tailwind.config.js` scans `features/**`, `components/**`, `app/**`, and `src/**`. Colors are CSS-variable-based HSL tokens (`hsl(var(--primary))` etc.). Dark mode is `class`-based.
