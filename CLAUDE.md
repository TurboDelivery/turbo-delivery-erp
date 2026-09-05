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

Copy `env.local.example` to `env.local` and fill in the values. `env.local` is
gitignored and must never be committed: the `.env*` pattern does not match a name
without a leading dot, which is how a configuration file reached the repository on
2025-07-22. Variables:

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


## REFONTE — RÈGLE OBLIGATOIRE

**L'objectif du chantier est une NOUVELLE VERSION du projet, pas une migration.**
Moderne, rapide, sûre, fiable, stable, ergonomique. Belle UI, bonne UX. Simple et facile
d'utilisation.

### Ce qui compte comme refonte, et ce qui n'en est pas

Remplacer `<Card>` v2 par `<Card.Header>` v3 **n'est pas une refonte.** C'est un
remplacement de composants. Si, après le changement, l'écran a la même architecture
d'information, la même hiérarchie et la même disposition, alors rien n'a été refondu.

Une refonte répond à trois questions AVANT d'écrire du code :
1. **que regarde l'opérateur en premier sur cet écran, et pourquoi ?**
2. **qu'est-ce qui appelle une action, et qu'est-ce qui informe seulement ?**
3. **quelle est la forme naturelle de cette donnée ?** Un état financier se lit en
   colonnes alignées, pas en tuiles. Une file d'attente se lit en liste, pas en grille.

### Règles fermes

- **Aucune donnée visible ne disparaît.** Chaque valeur, chaque lien de détail, chaque
  état de chargement et d'erreur présent avant doit être présent après. Seule la
  PRÉSENTATION change — et elle doit être pensée, pas transposée.
- **HeroUI v3 est le matériau, pas le but.** On utilise ses composants et son thème ; on
  ne réécrit pas ses styles à la main. Une classe de couleur écrite en dur là où un
  `variant` existe est une erreur.
- **La couleur dit quelque chose ou n'existe pas.** L'accent est réservé à ce qui appelle
  une action. Sept teintes décoratives sur un écran, c'est sept fois rien.
- **Les chiffres se comparent** : chasse tabulaire, alignement à droite, ordres de
  grandeur donnés quand un chiffre seul ne veut rien dire.
- **Vérifier À L'ÉCRAN.** `tsc` à 0 et un build vert ne prouvent rien sur une interface.
  Les régressions visuelles de ce projet ont TOUTES été trouvées par un humain qui
  regardait, jamais par un outil.

### Erreurs déjà commises, à ne pas refaire

- avoir passé une journée sur la plomberie (migrations, mesures, non-régression) en
  l'appelant refonte ;
- avoir « corrigé » une page en changeant un hexadécimal et une opacité, sur du balisage
  HTML brut, alors que la bibliothèque de composants était installée et documentée ;
- avoir remplacé les composants d'un écran sans toucher à sa conception, et l'avoir
  présenté comme une nouvelle interface.

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

- **HeroUI v3** (`@heroui-v3/react`), pas la v2. Le composant est composé :
  `Table > Table.ScrollContainer > Table.Content > Table.Header / Table.Body`.
- **Columns always in a separate file** (`*-table-columns.tsx`). Never inline `ColumnDef`
  arrays inside the table component or the hook.
- **Hook owns the table instance**: call `useReactTable({ data, columns, getCoreRowModel(), … })`
  inside a `useXxxTable` hook, not in the component. `flexRender` reste le pont entre
  TanStack et le rendu.
- **Autant de cellules que de colonnes**, toujours. React Aria lève « Cell count must match
  column count » et **la page entière tombe en 500**. Dériver le compte du squelette de
  chargement de la liste des colonnes, jamais d'un nombre écrit à la main.
- **Pagination** : `Table.Footer` — qui est FRÈRE de `Table.ScrollContainer`, hors de
  `Table.Content`, sans quoi il ne rend rien, sans erreur.
- **Sélection** : `selectionMode` + `Checkbox slot="selection"`. Si la sélection vient
  d'ailleurs (TanStack), passer `slot={null}` sur les cases, faute de quoi la v3 lève
  « A slot prop is required » et la page tombe.
- **Loading skeletons**: des `Table.Row` de la même forme que les vraies lignes, avec un
  `div animate-pulse` par cellule.
- Les autres pièges de la v3 sont documentés dans `app/apercu/composants` (galerie) et
  dans les bancs `app/apercu/*`, qui rendent chaque écran refondu sur données d'exemple,
  en clair et en sombre. **Un banc bascule le thème sur `<html>`, jamais sur une
  enveloppe** : `styles/tailwind.css` déclare encore les jetons shadcn en triplets HSL
  bruts dans la même portée `.dark`, et sur un div imbriqué c'est le triplet qui gagne —
  `bg-success` ne peint alors plus rien.

#### Minimal example

```tsx
// *-table-columns.tsx
import { ColumnDef } from '@tanstack/react-table';
export const myColumns: ColumnDef<IMyType>[] = [
  { accessorKey: 'nom', header: 'Nom', cell: ({ row }) => <span>{row.original.nom}</span> },
];

// *-table.tsx
import { Table } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import useMyTable from '@/features/.../hooks/use-my-table';

export function MyTable() {
  const { table, isLoading } = useMyTable();
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Mon tableau" className="min-w-[48rem]">
          <Table.Header>
            {table.getFlatHeaders().map((h, i) => (
              <Table.Column id={h.id} isRowHeader={i === 0} key={h.id}>
                {flexRender(h.column.columnDef.header, h.getContext())}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() =>
              isLoading ? null : <p className="py-8 text-center text-sm text-muted">Aucun résultat</p>
            }
          >
            {(isLoading ? [] : table.getRowModel().rows).map((row) => (
              <Table.Row id={row.id} key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
```

### Tailwind

`tailwind.config.js` scans `features/**`, `components/**`, `app/**`, and `src/**`. Colors are CSS-variable-based HSL tokens (`hsl(var(--primary))` etc.). Dark mode is `class`-based.
