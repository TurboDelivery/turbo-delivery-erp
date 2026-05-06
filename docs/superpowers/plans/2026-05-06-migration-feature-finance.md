# Finance Feature Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer les 9 sous-modules de `feature-finance/` vers `features/` en suivant le pattern canonique, puis supprimer `feature-finance/`.

**Architecture:** Migration module par module dans l'ordre des dépendances (ceux sans dépendances croisées d'abord). Chaque module = git mv + mise à jour des imports (sed global) + typecheck + commit. Les composants restent dans `features/<domain>/components/` (CLAUDE.md autorise ça pour les composants spécifiques à une feature).

**Tech Stack:** Next.js 14, TypeScript, TanStack Query, nuqs, Zod, pnpm

---

## Ordre de migration (dépendances croissantes)

| # | Module | Fichiers | Dépendances cross-modules dans feature-finance |
|---|--------|----------|------------------------------------------------|
| 1 | gestion-paiements | 15 | aucune |
| 2 | validation | 19 | aucune |
| 3 | rapports-financiers | 10 | aucune |
| 4 | rapports-performance | 26 | aucune |
| 5 | revenus | ~135 | (d'autres en dépendent → migré tôt) |
| 6 | depenses | 31 | merge dans features/depenses existant |
| 7 | charges | 31 | dépend de depenses |
| 8 | finance-dashboard | 24 | dépend de depenses + revenus |
| 9 | analyse-rentabilite | 6 | merge dans features/analyse-rentabilite existant |
| 10 | Cleanup | — | supprimer feature-finance/, mettre à jour CLAUDE.md |

## Pattern de chaque tâche

```bash
# 1. Créer la cible
mkdir -p features/<domain>

# 2. Déplacer (git détecte les renames par similarité de contenu > 50%)
cp -r feature-finance/<domain>/* features/<domain>/
git add features/<domain>/
git rm -r --cached feature-finance/<domain>/
rm -rf feature-finance/<domain>/

# 3. Mettre à jour tous les imports dans le projet
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/<domain>/|@/features/<domain>/|g'

# 4. Vérifier
pnpm tsc --noEmit

# 5. Committer
git add -A
git commit -m "feat(migration): move <domain> from feature-finance to features"
```

---

## Task 1: Migrer gestion-paiements

**Files:**
- Move: `feature-finance/gestion-paiements/` → `features/gestion-paiements/`
- Consumers: `app/(protected)/finance/gestion-paiements/page.tsx`

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/gestion-paiements
cp -r feature-finance/gestion-paiements/* features/gestion-paiements/
git add features/gestion-paiements/
git rm -r --cached feature-finance/gestion-paiements/
rm -rf feature-finance/gestion-paiements/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/gestion-paiements/|@/features/gestion-paiements/|g'
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 4: Committer**

```bash
git add -A
git commit -m "feat(migration): move gestion-paiements from feature-finance to features"
```

---

## Task 2: Migrer validation

**Files:**
- Move: `feature-finance/validation/` → `features/validation-finance/`
- Note: `features/validation-tickets/` existe déjà → nommer `validation-finance` pour éviter la confusion
- Consumers: `app/(protected)/finance/validation/page.tsx`

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/validation-finance
cp -r feature-finance/validation/* features/validation-finance/
git add features/validation-finance/
git rm -r --cached feature-finance/validation/
rm -rf feature-finance/validation/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/validation/|@/features/validation-finance/|g'
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 4: Committer**

```bash
git add -A
git commit -m "feat(migration): move validation from feature-finance to features/validation-finance"
```

---

## Task 3: Migrer rapports-financiers

**Files:**
- Move: `feature-finance/rapports-financiers/` → `features/rapports-financiers/`
- Consumers: `app/(protected)/finance/rapports-financiers/page.tsx`

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/rapports-financiers
cp -r feature-finance/rapports-financiers/* features/rapports-financiers/
git add features/rapports-financiers/
git rm -r --cached feature-finance/rapports-financiers/
rm -rf feature-finance/rapports-financiers/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/rapports-financiers/|@/features/rapports-financiers/|g'
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 4: Committer**

```bash
git add -A
git commit -m "feat(migration): move rapports-financiers from feature-finance to features"
```

---

## Task 4: Migrer rapports-performance

**Files:**
- Move: `feature-finance/rapports-performance/` → `features/rapports-performance/`
- Consumers: `app/(protected)/finance/rapports-performance/page.tsx`, `app/(protected)/finance/rapports-performance/dashboard-performance/page.tsx`

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/rapports-performance
cp -r feature-finance/rapports-performance/* features/rapports-performance/
git add features/rapports-performance/
git rm -r --cached feature-finance/rapports-performance/
rm -rf feature-finance/rapports-performance/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/rapports-performance/|@/features/rapports-performance/|g'
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 4: Committer**

```bash
git add -A
git commit -m "feat(migration): move rapports-performance from feature-finance to features"
```

---

## Task 5: Migrer revenus

**Files:**
- Move: `feature-finance/revenus/` → `features/revenus/`
- Consumers:
  - `app/(protected)/finance/revenue/*/page.tsx` (5 pages)
  - `features/recouvrements/apis/recouvrement.api.ts`
  - `features/recouvrements/queries/*.ts` (4 fichiers)
  - `features/recouvrements/columns/recouvrement-columns.tsx`
  - `components/finance/recouvrements/**/*.tsx` (3 fichiers)
  - `feature-finance/dashboard/components/repartition/**` (2 fichiers — seront mis à jour en Task 8)
  - `feature-finance/depenses/components/depense-list/creer-depense.tsx` (sera mis à jour en Task 6)

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/revenus
cp -r feature-finance/revenus/* features/revenus/
git add features/revenus/
git rm -r --cached feature-finance/revenus/
rm -rf feature-finance/revenus/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/revenus/|@/features/revenus/|g'
```

- [ ] **Step 3: Corriger les imports relatifs internes dans feature-finance/depenses**

Vérifier que `feature-finance/depenses/components/common/depense-form.tsx` qui importe `../../../revenus/types/revenus.types` fonctionne toujours (chemin relatif cassé car revenus a bougé). Le corriger :

```bash
# Chercher les imports relatifs vers revenus dans depenses
grep -r "\.\./\.\./\.\./revenus" feature-finance/depenses/ --include="*.ts" --include="*.tsx"
```

Si trouvé, remplacer par l'import absolu :
```bash
sed -i "s|../../../revenus/|@/features/revenus/|g" \
  feature-finance/depenses/components/common/depense-form.tsx
```

Faire de même dans tout fichier restant dans `feature-finance/` avec des imports relatifs vers revenus :
```bash
find feature-finance/ -type f \( -name "*.ts" -o -name "*.tsx" \) | \
  xargs grep -l "\.\./.*revenus" | head -20
```

Corriger manuellement chaque fichier trouvé en remplaçant le chemin relatif par `@/features/revenus/...`.

- [ ] **Step 4: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5: Committer**

```bash
git add -A
git commit -m "feat(migration): move revenus from feature-finance to features"
```

---

## Task 6: Migrer depenses (merge dans features/depenses existant)

**Contexte:** `features/depenses/` existe déjà avec `apis/`, `filters/`, `hooks/`, `schemas/`, `types/`, `depense-stats.utils.ts`. Les hooks dans `features/depenses/hooks/` importent déjà depuis `@/feature-finance/depenses/queries/`. Cette task fusionne `feature-finance/depenses/` dans `features/depenses/`.

**Files:**
- Move: `feature-finance/depenses/actions/` → `features/depenses/actions/`
- Move: `feature-finance/depenses/components/` → `features/depenses/components/`
- Move: `feature-finance/depenses/filters/` → merger avec `features/depenses/filters/`
- Move: `feature-finance/depenses/hooks/use-depense-list.ts` → `features/depenses/hooks/`
- Move: `feature-finance/depenses/queries/` → `features/depenses/queries/`
- Consumers:
  - `features/depenses/hooks/*.ts` (4 fichiers — imports locaux après merge)
  - `components/depenses/**/*.tsx` (5 fichiers)
  - `components/depenses/charts/depense-summary-pie-chart-table.tsx`
  - `feature-finance/charges/components/charges-page-content-v2.tsx`
  - `feature-finance/charges/components/add-charge-fixe-modal.tsx`
  - `feature-finance/charges/components/add-depense-variable-modal.tsx`
  - `feature-finance/dashboard/components/dashboardFinanceStatistics.tsx`
  - `feature-finance/dashboard/components/repartition/**`
  - `feature-finance/analyse-rentabilite/components/AnalyseRentabiliteContent.tsx`
  - `app/(protected)/finance/depense/page.tsx`
  - `app/(protected)/finance/sorties/page.tsx`

- [ ] **Step 1: Déplacer actions, components, hooks, queries**

```bash
# Actions
mkdir -p features/depenses/actions
cp -r feature-finance/depenses/actions/* features/depenses/actions/
git add features/depenses/actions/

# Components (nouveau dossier dans features/depenses)
mkdir -p features/depenses/components
cp -r feature-finance/depenses/components/* features/depenses/components/
git add features/depenses/components/

# Hook supplémentaire
cp feature-finance/depenses/hooks/use-depense-list.ts features/depenses/hooks/
git add features/depenses/hooks/use-depense-list.ts

# Queries
mkdir -p features/depenses/queries
cp -r feature-finance/depenses/queries/* features/depenses/queries/
git add features/depenses/queries/

# Filter (merger avec l'existant)
cp feature-finance/depenses/filters/depense.filter.ts features/depenses/filters/
git add features/depenses/filters/depense.filter.ts

# Supprimer l'ancienne source
git rm -r --cached feature-finance/depenses/
rm -rf feature-finance/depenses/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/depenses/|@/features/depenses/|g'
```

- [ ] **Step 3: Corriger les imports relatifs cassés dans features/depenses/components**

Les composants dans `features/depenses/components/` peuvent avoir des imports relatifs vers `../../../revenus/` (maintenant `@/features/revenus/`) ou vers `../queries/` (maintenant locaux). Vérifier :

```bash
grep -r "\.\./\.\./\.\./revenus\|\.\./\.\./revenus" \
  features/depenses/components/ --include="*.ts" --include="*.tsx"
```

Si trouvé, corriger :
```bash
find features/depenses/components/ -type f \( -name "*.ts" -o -name "*.tsx" \) | \
  xargs sed -i 's|\.\./\.\./\.\./revenus/|@/features/revenus/|g'
```

- [ ] **Step 4: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5: Committer**

```bash
git add -A
git commit -m "feat(migration): merge depenses from feature-finance into features/depenses"
```

---

## Task 7: Migrer charges

**Files:**
- Move: `feature-finance/charges/` → `features/charges/`
- Consumers:
  - `app/(protected)/finance/charges/page.tsx`
  - `app/(protected)/finance/charges/details/page.tsx`
  - `feature-finance/analyse-rentabilite/components/AnalyseRentabiliteContent.tsx` (charges/queries)

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/charges
cp -r feature-finance/charges/* features/charges/
git add features/charges/
git rm -r --cached feature-finance/charges/
rm -rf feature-finance/charges/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/charges/|@/features/charges/|g'
```

- [ ] **Step 3: Corriger les imports relatifs dans features/charges/components**

Les composants dans `features/charges/components/` qui importaient `@/feature-finance/depenses/...` ont été mis à jour en Step 2. Vérifier qu'il ne reste pas d'imports relatifs cassés :

```bash
grep -r "feature-finance" features/charges/ --include="*.ts" --include="*.tsx"
```

Expected: aucun résultat

- [ ] **Step 4: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5: Committer**

```bash
git add -A
git commit -m "feat(migration): move charges from feature-finance to features"
```

---

## Task 8: Migrer finance-dashboard

**Contexte:** `features/dashboard/` existe déjà (dashboard général). Le dashboard finance devient `features/finance-dashboard/` pour éviter la collision.

**Files:**
- Move: `feature-finance/dashboard/` → `features/finance-dashboard/`
- Consumers:
  - `components/dashboard/finance-dashboard.tsx`
  - `feature-finance/analyse-rentabilite/components/AnalyseRentabiliteContent.tsx`

- [ ] **Step 1: Créer le dossier cible et déplacer les fichiers**

```bash
mkdir -p features/finance-dashboard
cp -r feature-finance/dashboard/* features/finance-dashboard/
git add features/finance-dashboard/
git rm -r --cached feature-finance/dashboard/
rm -rf feature-finance/dashboard/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/dashboard/|@/features/finance-dashboard/|g'
```

- [ ] **Step 3: Vérifier que l'import vers features/dashboard/utils/graphe.utils est intact**

`features/finance-dashboard/hooks/use-dashboard-stats.ts` importe depuis `@/features/dashboard/utils/graphe.utils` — cet import ne change pas (c'est déjà dans `features/`). Vérifier :

```bash
grep "features/dashboard" features/finance-dashboard/hooks/use-dashboard-stats.ts
```

Expected: l'import est présent et inchangé

- [ ] **Step 4: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5: Committer**

```bash
git add -A
git commit -m "feat(migration): move finance dashboard from feature-finance to features/finance-dashboard"
```

---

## Task 9: Migrer analyse-rentabilite (merge dans features/analyse-rentabilite existant)

**Contexte:** `features/analyse-rentabilite/` existe déjà avec `apis/daily-stats.api.ts` et `types/daily-stats.type.ts`. L'action dans `feature-finance/analyse-rentabilite/actions/daily-stats.action.ts` importe déjà depuis `@/features/analyse-rentabilite/...` — ces imports ne changeront pas.

**Files:**
- Move: `feature-finance/analyse-rentabilite/actions/` → `features/analyse-rentabilite/actions/`
- Move: `feature-finance/analyse-rentabilite/components/` → `features/analyse-rentabilite/components/`
- Move: `feature-finance/analyse-rentabilite/queries/` → `features/analyse-rentabilite/queries/`
- Move: `feature-finance/analyse-rentabilite/types/rentabilite.type.ts` → `features/analyse-rentabilite/types/`
- Move: `feature-finance/analyse-rentabilite/index.ts` → `features/analyse-rentabilite/index.ts`
- Consumers:
  - `app/(protected)/finance/analyse-rentabilite/page.tsx`

- [ ] **Step 1: Déplacer les fichiers dans features/analyse-rentabilite**

```bash
# Actions
mkdir -p features/analyse-rentabilite/actions
cp feature-finance/analyse-rentabilite/actions/daily-stats.action.ts \
   features/analyse-rentabilite/actions/
git add features/analyse-rentabilite/actions/

# Components
mkdir -p features/analyse-rentabilite/components
cp feature-finance/analyse-rentabilite/components/*.tsx \
   features/analyse-rentabilite/components/
git add features/analyse-rentabilite/components/

# Queries
mkdir -p features/analyse-rentabilite/queries
cp feature-finance/analyse-rentabilite/queries/daily-stats.query.ts \
   features/analyse-rentabilite/queries/
git add features/analyse-rentabilite/queries/

# Types (merge avec l'existant)
cp feature-finance/analyse-rentabilite/types/rentabilite.type.ts \
   features/analyse-rentabilite/types/
git add features/analyse-rentabilite/types/rentabilite.type.ts

# Index
cp feature-finance/analyse-rentabilite/index.ts features/analyse-rentabilite/index.ts
git add features/analyse-rentabilite/index.ts

# Supprimer l'ancienne source
git rm -r --cached feature-finance/analyse-rentabilite/
rm -rf feature-finance/analyse-rentabilite/
```

- [ ] **Step 2: Mettre à jour tous les imports**

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" | \
  xargs sed -i 's|@/feature-finance/analyse-rentabilite/|@/features/analyse-rentabilite/|g'
```

- [ ] **Step 3: Corriger les imports relatifs dans features/analyse-rentabilite/components**

`AnalyseRentabiliteContent.tsx` importait depuis `@/feature-finance/dashboard/...`, `@/feature-finance/depenses/...`, `@/feature-finance/charges/...` — tous déjà mis à jour par les tâches précédentes (Step 2 de chaque task). Vérifier :

```bash
grep "feature-finance" features/analyse-rentabilite/ -r --include="*.ts" --include="*.tsx"
```

Expected: aucun résultat

- [ ] **Step 4: Vérifier le typecheck**

```bash
pnpm tsc --noEmit
```

Expected: aucune erreur

- [ ] **Step 5: Committer**

```bash
git add -A
git commit -m "feat(migration): merge analyse-rentabilite from feature-finance into features"
```

---

## Task 10: Cleanup final

- [ ] **Step 1: Vérifier que feature-finance/ est vide**

```bash
ls feature-finance/
```

Expected: dossier vide ou seulement `auth/` (vide depuis Task 0 du nettoyage du code mort)

- [ ] **Step 2: Supprimer feature-finance/**

```bash
rm -rf feature-finance/
git add -A
```

- [ ] **Step 3: Mettre à jour CLAUDE.md**

Dans `CLAUDE.md`, supprimer la section "Legacy Code" :
```
### Legacy Code

`feature-finance/` is a legacy directory being migrated. New finance code belongs in `features/`. Do not add new files to `feature-finance/`.
```

Et la remplacer par :
```markdown
### Finance Modules

Les modules finance sont dans `features/` : `charges`, `depenses`, `revenus`, `gestion-paiements`, `finance-dashboard`, `rapports-financiers`, `rapports-performance`, `validation-finance`, `analyse-rentabilite`.
```

- [ ] **Step 4: Vérifier que Tailwind scanne les nouveaux chemins**

`tailwind.config.js` scanne déjà `features/**` — aucune modification nécessaire.

- [ ] **Step 5: Typecheck final**

```bash
pnpm tsc --noEmit
```

Expected: exit 0, aucune erreur

- [ ] **Step 6: Committer**

```bash
git add -A
git commit -m "feat(migration): delete feature-finance/ - migration complete"
```

---

## Notes importantes

### Imports relatifs cassés après les moves

Certains fichiers dans `feature-finance/` utilisent des imports relatifs entre modules (ex: `../../../revenus/`). Après déplacement, ces chemins relatifs changent. La Task 5 et 6 couvrent les cas connus. En cas d'erreur de typecheck, chercher :

```bash
# Trouver tous les imports relatifs qui pointent en dehors du module
grep -r "\.\./\.\./\.\." features/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

### Vérification des imports feature-finance résiduels

Après chaque task, vérifier qu'aucun import vers `feature-finance/<domain>/` ne subsiste :

```bash
grep -r "feature-finance/<domain>" . --include="*.ts" --include="*.tsx" \
  -not -path "*/node_modules/*" -not -path "*/.next/*"
```

### Si une task casse le typecheck

1. `git status` pour voir les fichiers modifiés
2. Chercher les erreurs TypeScript spécifiques
3. Corriger les imports manuellement
4. Re-run `pnpm tsc --noEmit`
5. Ne pas committer tant que le typecheck n'est pas propre
