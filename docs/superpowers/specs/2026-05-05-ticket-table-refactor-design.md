# Refactorisation TicketTable — Design Spec

**Date :** 2026-05-05
**Branche :** Yamoussa
**Composant cible :** `components/tickets/table/ticket-table.tsx`

## Contexte

`TicketTable` fait ~550 lignes et mélange : logique métier (calcul de commission, permissions), état UI (saisie, édition, authentification), rendu table et navigation par onglets. L'objectif est de rendre le composant quasi-présentationnel en extrayant l'état vers `features/tickets/hooks/` et en corrigeant les bugs identifiés.

## Approche choisie

Refacto progressive en 3 phases indépendantes et déployables.

---

## Phase 1 — Corrections de bugs et élimination des doublons

### 1.1 Fusionner `updateTicketField` et `applyTicketPatch`

Les deux fonctions font la même chose : appliquer un patch sur un ticket et recalculer la commission si `restaurantId` ou `montantCommande` change. On supprime `updateTicketField` et `handleTicketChange` appelle `applyTicketPatch(ticket, { [field]: value })`.

### 1.2 Extraire `calculateCommission` vers `features/tickets/utils/commission.utils.ts`

Signature : `calculateCommission(restaurant: Restaurant, montantCommande: number): number | null`

Logique :
- Si `typeCommission === 'POURCENTAGE'` → `montantCommande * (commission / 100)` arrondi à 2 décimales
- Sinon → `null`

Importée par `applyTicketPatch` et les mutations si nécessaire.

### 1.3 Unifier la suppression (unitaire + masse) sur `ConfirmModal`

Remplacer `ticketToDelete: string | null` par `ticketsToDelete: string[] | null`. Le modal affiche :
- 1 ticket → `"Confirmez-vous la suppression définitive de ce ticket ?"`
- N tickets → `"Confirmez-vous la suppression de N ticket(s) ?"`

Supprimer `window.confirm` dans `handleDeleteRows`.

### 1.4 Dédupliquer `getRestaurantInfo`

Extraire un helper local privé :
```ts
const getRestaurantInfo = (restaurantId: string) => {
  const rest = restaurants.find((r) => r.id === restaurantId);
  return rest ? { typeCommission: rest.typeCommission, commission: Number(rest.commission ?? 0) } : undefined;
};
```
Utilisé par `handleSaveNewTicket` et `handleSaveRow`.

---

## Phase 2 — Extraction des hooks vers `features/tickets/`

### Nouveaux fichiers

**`features/tickets/hooks/use-new-tickets.ts`**

Paramètres : `{ restaurants, livreurOptions, restaurantOptions, createBonLivraisonMutation }`

Expose :
- `newTickets: Ticket[]`
- `newTicketIds: Set<string>`
- `insertState: { insertCount, insertLivreurId, insertRestaurantId, insertDate, setters... }`
- `handleInsert()`
- `handleSaveNewTicket(id)`
- `handleCancelNewTicket(id)`
- `handleNewTicketChange(id, field, value)`
- `handleNewTicketPatch(id, patch)`

**`features/tickets/hooks/use-ticket-editing.ts`**

Paramètres : `{ restaurants, ticketsData, updateBonLivraisonMutation }`

Gère en interne `editingIds` et `editedTickets` (ces états quittent `useTickets`).

Expose :
- `editingIds: Set<string>`
- `editedTickets: Map<string, Ticket>`
- `handleEditRow(id)`
- `handleCancelEditRow(id)`
- `handleSaveRow(id)`
- `handleTicketChange(id, field, value)` — pour tickets existants
- `handleTicketPatch(id, patch)` — pour tickets existants
- `getDisplayTicket(ticket)`

`useTickets` appelle ce hook en interne et re-expose ses valeurs. Importe `applyTicketPatch` depuis `commission.utils.ts`.

**`features/tickets/hooks/use-ticket-authentication.ts`**

Expose :
- `authenticatedIds: Set<string>`
- `handleAuthentifier(id)`

### Modification de `useTickets` (existant)

`useTickets` intègre `use-ticket-editing` et expose un objet `editing` unifié. `TicketTable` n'importe que `useTickets` comme hook racine pour l'état d'édition.

### Résultat dans `TicketTable`

États locaux restants : `rowSelection`, `ticketsToDelete`. Tout l'état métier vient des hooks features.

---

## Phase 3 — Insert bar au niveau page + CASL

### 3.1 Composant `TicketInsertBar`

**Fichier :** `components/tickets/table/ticket-insert-bar.tsx`

Props : `{ restaurants, livreurOptions, restaurantOptions, insertState, onInsert, canCreate }`

Le composant parent (page) monte `<TicketInsertBar>` au-dessus de `<TicketTable>`. L'état d'insertion (`insertState`) vient de `use-new-tickets` instancié dans la page, pas dans `TicketTable`.

### 3.2 Migration des permissions vers CASL

**Dans `lib/casl/ability.ts`**, ajouter les règles manquantes pour `Ticket` :

| Action | Rôles autorisés |
|---|---|
| `create` | tous les rôles (comportement actuel : `canCreate: true` en dur) |
| `update` | tous sauf `STANDARD`, `centrale d'appel`, `COMPTABLE` |
| `delete` | tous sauf `STANDARD`, `centrale d'appel`, `COMPTABLE` |
| `authentifier` | déjà présent |

Supprimer la dérivation `role === 'standard'` du composant. `TicketTable` et `TicketInsertBar` utilisent uniquement `ability.can('update', 'Ticket')` via `useAbility()`.

### Résultat final de `TicketTable`

~150 lignes. Le composant :
- assemble `tableMeta` depuis les hooks
- rend la table HeroUI avec skeleton
- rend `<TicketTableFilters>`
- rend les onglets
- rend `<TicketTableActions>`
- rend `<ConfirmModal>`

Zéro logique métier, zéro calcul de commission, zéro comparaison de rôle.

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `features/tickets/utils/commission.utils.ts` | Créer |
| `features/tickets/hooks/use-new-tickets.ts` | Créer |
| `features/tickets/hooks/use-ticket-editing.ts` | Créer |
| `features/tickets/hooks/use-ticket-authentication.ts` | Créer |
| `features/tickets/hooks/use-tickets.ts` | Modifier |
| `components/tickets/table/ticket-insert-bar.tsx` | Créer |
| `components/tickets/table/ticket-table.tsx` | Modifier (refacto complète) |
| `lib/casl/ability.ts` | Modifier |
| Page parente (`app/(protected)/...`) | Modifier (monter TicketInsertBar) |

## Non inclus dans ce scope

- Modification de `ticket-table-columns.tsx`, `ticket-table-filters.tsx`, `ticket-table-actions.tsx`
- Refacto de l'onglet "Par Livreur"
- Tests automatisés (pas de test runner configuré)
