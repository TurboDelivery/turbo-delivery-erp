# Remove ISR / Force Dynamic Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer le pre-rendering statique au build time sur toutes les pages protégées en forçant le dynamic rendering via une seule modification du layout racine.

**Architecture:** Next.js App Router propage la contrainte `force-dynamic` d'un layout à toutes ses routes enfants. Le layout `app/(protected)/layout.tsx` couvre les ~45 pages affectées. Une seule ligne suffit au lieu de modifier chaque page individuellement.

**Tech Stack:** Next.js 14 App Router, segment config `export const dynamic`

---

## Contexte technique

Par défaut, Next.js App Router tente de **statiquement pré-rendre** toutes les pages qui n'utilisent pas explicitement de fonctions dynamiques (`cookies()`, `headers()`, `searchParams`). Les pages de ce projet utilisent `apiClientHttp` (Axios), que Next.js ne peut pas analyser statiquement — donc il essaie de pré-rendre ces pages au `next build`. En CI/CD, le backend est absent → echec du build.

Pages confirmées sans `force-dynamic` (~45 fichiers) :
- `app/(protected)/tickets/page.tsx` — appelle `getAllRestaurants()` au build time
- `app/(protected)/analystics/page.tsx` — rendu SSG du shell
- `app/(protected)/delivery-men/**` — toutes les pages livreurs
- `app/(protected)/external_delivery/**`
- `app/(protected)/finance/**` (hors celles déjà couvertes)
- `app/(protected)/restaurants/**`
- `app/(protected)/settings/**`, `users/`, `personnel/`, etc.

Pages déjà correctes (ont `force-dynamic`) :
- `validation-tickets/grille-de-paiement/`, `regularisation/`, `verification-v1/`, `verrouillage-v2/`, `visa-dga/`
- `commandes/`

---

## File Structure

| Action | Fichier | Modification |
|--------|---------|--------------|
| Modify | `app/(protected)/layout.tsx` | Ajouter `export const dynamic = 'force-dynamic'` |

---

### Task 1 : Ajouter `force-dynamic` au layout protégé

**Files:**
- Modify: `app/(protected)/layout.tsx` (ligne 1-2, avant les imports ou avant le `export default`)

- [ ] **Step 1 : Lire l'état actuel du layout**

```bash
head -5 app/(protected)/layout.tsx
```

Résultat attendu : pas de `export const dynamic` en tête de fichier.

- [ ] **Step 2 : Ajouter la directive au layout**

Ouvrir `app/(protected)/layout.tsx` et ajouter **avant** la première ligne `import` :

```typescript
export const dynamic = 'force-dynamic';
```

Le fichier doit commencer par :

```typescript
export const dynamic = 'force-dynamic';

import React from 'react';
import { redirect } from 'next/navigation';
// ... reste des imports inchangés
```

- [ ] **Step 3 : Vérifier qu'aucun doublon n'existe**

```bash
grep -r "export const dynamic" app/(protected)/layout.tsx
```

Résultat attendu : exactement 1 occurrence.

- [ ] **Step 4 : Lancer le build local pour valider**

```bash
pnpm build
```

Résultat attendu : build réussi sans erreurs de type "Failed to fetch" ou timeout API. Si des erreurs persistent sur des pages spécifiques, noter leurs chemins et ajouter `force-dynamic` individuellement à ces pages.

- [ ] **Step 5 : Vérifier les pages validation-tickets (déjà correctes)**

S'assurer que les pages qui avaient déjà `force-dynamic` individuellement ne cassent pas (elles restent compatibles — avoir `force-dynamic` à deux niveaux n'est pas un problème).

```bash
grep -r "export const dynamic" app/(protected)/validation-tickets/
```

Résultat attendu : les 5 fichiers existants conservent leur propre directive.

- [ ] **Step 6 : Commit**

```bash
git add app/(protected)/layout.tsx
git commit -m "fix: force dynamic rendering on all protected routes to prevent build-time API calls"
```

---

## Notes d'implémentation

- Si le build continue d'échouer sur des pages spécifiques après cette modification, c'est que ces pages ont leur propre layout intermédiaire (ex: `delivery-men/(valided)/layout.tsx`) qui override la config. Dans ce cas, ajouter `force-dynamic` à ces layouts intermédiaires également.
- Les pages déjà en `force-dynamic` individuellement (`commandes/`, `validation-tickets/*`) peuvent conserver leur directive individuelle — c'est redondant mais inoffensif.
- Cette modification n'a aucun impact sur les performances runtime : toutes ces pages servent des utilisateurs authentifiés avec des données temps réel. Elles ne bénéficiaient pas du static rendering de toute façon.
