# Typography Scaling — Guide de mise à l'échelle des textes

Ce document explique comment les tailles de texte sont adaptées sur les très grands écrans (≥ 1536 px, breakpoint Tailwind `2xl:`) et comment répliquer rapidement ce travail sur n'importe quelle page du projet.

> **Page de référence (validation visuelle)** : `app/(protected)/analystics/page.tsx`.
> Tous les exemples ci-dessous sont inspirés des changements réalisés sur cette page.

---

## 1. Principe général

Nous utilisons le breakpoint **`2xl:` de Tailwind (≥ 1536 px)** comme seuil unique pour « écran très large ». Au-dessous, rien ne change.

La règle est simple : **ajouter une classe `2xl:text-<taille supérieure>` à côté de la classe de taille existante**.

```tsx
// avant
<p className="text-sm font-medium">…</p>

// après
<p className="text-sm 2xl:text-base font-medium">…</p>
```

Échelle recommandée (un cran au-dessus) :

| Taille de base | Ajout `2xl:` |
|---------------|--------------|
| `text-xs`     | `2xl:text-sm` |
| `text-sm`     | `2xl:text-base` |
| `text-medium` (HeroUI ≈ 15 px) | `2xl:text-lg` |
| `text-base`   | `2xl:text-lg` |
| `text-lg`     | `2xl:text-xl` |
| `text-xl`     | `2xl:text-2xl` |
| `text-2xl`    | `2xl:text-3xl` |
| `text-3xl`    | `2xl:text-4xl` |
| `text-4xl`    | `2xl:text-5xl` |
| `text-5xl`    | `2xl:text-6xl` |
| `text-6xl`    | `2xl:text-7xl` |

---

## 2. Source centralisée : `components/primitives.ts`

Tout texte rendu via les helpers `title()`, `subtitle()` ou `body()` est **déjà mis à l'échelle** — rien à faire au cas par cas. Le fichier à modifier si l'on veut ajuster la typo globalement est `components/primitives.ts`.

Extrait actuel (après la refonte) :

```ts
// title
h1: "text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl leading-auto"
h2: "text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl leading-auto"
h3: "text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl leading-auto"
h4: "text-lg  md:text-xl  lg:text-3xl 2xl:text-4xl leading-auto"
h5: "text-xl lg:text-2xl 2xl:text-3xl leading-auto"
h6: "text-lg lg:text-xl  2xl:text-2xl leading-auto"

// subtitle
base: "… text-lg lg:text-xl 2xl:text-2xl …"

// body
body:     "text-base 2xl:text-lg leading-6"
body2:    "text-sm   2xl:text-base leading-5"
caption:  "text-sm   2xl:text-base leading-4 text-muted-foreground"
overline: "text-sm   2xl:text-base leading-4 font-bold tracking-tight"
```

➡ **Pour ajuster la taille globale sur grands écrans** : éditer uniquement les lignes `2xl:text-*` de ce fichier. Tout composant qui utilise `title({ size: 'h4' })`, `body({ size: 'body2' })`, etc. hérite du changement.

---

## 3. Que faire pour une page qui n'utilise PAS les primitives ?

Beaucoup de composants historiques utilisent du Tailwind direct (`text-2xl font-bold …`). Pour ces cas, on ajoute la classe `2xl:` inline.

### Procédure recommandée (5 étapes)

1. **Lister les classes de taille présentes** dans les fichiers de la page :
   ```bash
   rtk grep -nE "\btext-(xs|sm|base|medium|lg|xl|[2-6]xl)\b" <chemin/du/composant>.tsx
   ```
2. **Ajouter le pendant `2xl:`** selon le tableau de la section 1. Exemple :
   - `text-2xl font-bold` → `text-2xl 2xl:text-3xl font-bold`
   - `text-sm text-muted-foreground` → `text-sm 2xl:text-base text-muted-foreground`
3. **Ne pas doubler les sauts**. Un cran suffit ; viser deux crans (`text-sm 2xl:text-lg`) rend les interfaces disproportionnées.
4. **Conserver tous les modificateurs existants** (`font-*`, couleur, `leading-*`, …). On ajoute uniquement `2xl:text-*`.
5. **Valider sur ≥ 1536 px** (DevTools → responsive → 1600 px ou 1920 px) avant de passer au composant suivant.

### Points d'attention

- **Classes `text-medium` de HeroUI** : équivalent ~15 px. Pendant `2xl:` : `2xl:text-lg`.
- **Tailles d'icônes** : ne pas modifier en même temps. Si une icône semble trop petite ensuite, la traiter dans une deuxième passe (`size-6 2xl:size-7` par exemple).
- **Boutons** : ne scaler que le label (`text-xs 2xl:text-sm`) si la densité du bouton doit rester la même. Sinon augmenter aussi `px-*` / `py-*`.
- **Tableaux / datatables** : éviter le scaling automatique, la densité est volontaire. À faire au cas par cas.
- **Inputs / formulaires** : idem, laisser la taille par défaut pour ne pas casser l'alignement avec les labels.

---

## 4. Rollout progressif sur tout le projet

La page `analystics` sert de test. Une fois validée, appliquer ceci page par page, dans l'ordre suivant (du plus visible au moins critique) :

1. `app/(protected)/dashboard/**` (pages de vue d'ensemble)
2. `app/(protected)/restaurants/**`, `personnel/**`, `users/**`
3. `app/(protected)/finance/**`
4. `app/(protected)/trafic/**`
5. Composants partagés encore en inline Tailwind (`components/dashboard/**`, `components/finance/**`)
6. Pages d'authentification et landing

### Workflow page par page

```bash
# 1. Repérer les candidats
rtk grep -nE "\btext-(base|lg|xl|2xl|3xl|4xl|5xl|6xl|medium)\b" app/(protected)/<page>

# 2. Éditer — ajouter `2xl:text-*` inline selon le tableau de la section 1
# 3. Vérifier visuellement à 1600 px puis 1920 px
# 4. Commit atomique par page : "feat(ui): scale typography on <page> for ≥2xl screens"
```

---

## 5. Modifier rapidement l'échelle globale

Trois leviers, du plus fin au plus large :

| Besoin | Fichier à modifier | Effet |
|-------|--------------------|-------|
| Changer la taille d'un titre (h1…h6) partout | `components/primitives.ts` → `title` | Impacte toutes les pages qui utilisent `title({ size })` |
| Changer la taille des paragraphes | `components/primitives.ts` → `body` / `subtitle` | Impacte toute utilisation de `body()` / `subtitle()` |
| Désactiver temporairement le scaling `2xl:` | Supprimer toutes les classes `2xl:text-*` via un find/replace ciblé | Retour au comportement antérieur |
| Introduire un nouveau palier (`3xl:` ≥ 1920 px) | Ajouter `screens: { '3xl': '1920px' }` dans `tailwind.config.js` puis ajouter `3xl:text-*` | Permet un deuxième cran pour écrans 4K |

### Find/replace utile

Désactiver tout le scaling `2xl:` d'un coup (retour à l'état initial) :

```bash
# depuis la racine du projet
rtk grep -lE "\s2xl:text-(xs|sm|base|medium|lg|xl|[2-7]xl)\b" -- .
# puis pour chaque fichier remonté, supprimer la classe 2xl:text-* concernée
```

---

## 6. Checklist de revue

Avant de merger une PR « scaling typo » :

- [ ] Page testée à 1280 px (lg) — aucune régression
- [ ] Page testée à 1600 px (2xl) — les textes montent d'un cran
- [ ] Page testée à 1920 px — le rendu reste équilibré
- [ ] Aucun chevauchement avec les icônes, badges ou boutons voisins
- [ ] Les tableaux / datatables ne sont pas impactés
- [ ] Les composants réutilisés (primitives) n'ont pas été surclassés en local si `title()` / `body()` suffisaient

---

**Fichiers modifiés lors de l'expérimentation initiale (page analytics)** :

- `components/primitives.ts` — primitives `title`, `subtitle`, `body`
- `components/dashboard/apercu/DatabaseCards.tsx` — via `title()`
- `feature-finance/dashboard/components/dashboardFinanceStatistics.tsx`
- `feature-finance/dashboard/components/finance-highlight-card.tsx`
- `feature-finance/dashboard/components/ca-card.tsx`
