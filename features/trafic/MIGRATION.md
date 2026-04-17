# Migration — Feature `trafic`

Migration de la page `/trafic` de l'ancienne architecture (server action + `useState` + `setInterval`) vers la nouvelle architecture **feature-based + React Query** (alignée sur `features/tickets`).

---

## 1. Objectifs

- Remplacer le polling manuel (`setInterval`) par le cache React Query et son `refetchInterval`.
- Unifier la source de vérité : polling et socket écrivent dans le **même cache** (`queryKey: ['trafic','livreurs']`).
- Isoler le domaine `trafic` dans `features/trafic/` (types, request, queries, hooks, components).
- Corriger au passage le bug Leaflet « Map container is already initialized ».

---

## 2. Avant / Après

### Arborescence supprimée
```
app/(protected)/trafic/
  content.tsx        # useState + setInterval 15s + JSX map/dashboard
  useRealTime.tsx    # socket.io, mettait à jour un useState local (non câblé)
  searchBar.tsx      # inutilisé
  test-socket.js     # script de debug
src/actions/trafic.actions.ts  # server action wrappant apiClientHttp
```

### Arborescence cible
```
features/trafic/
├── types/trafic.type.ts              # réexports + EMPTY_TRAFIC_RESPONSE
├── request/trafic.request.ts         # getTraficDeliversRequest / getTraficLivreursRequest
├── queries/
│   ├── index.query.ts                # traficKeyQuery + useInvalidateTraficQuery
│   └── trafic.query.ts               # traficQueryOption + useTraficQuery + prefetchTraficQuery
├── hooks/
│   ├── use-realtime-trafic.ts        # socket → queryClient.setQueryData
│   └── use-trafic.ts                 # hook composite (query + realtime + UI state)
└── components/
    └── trafic-content.tsx            # écran complet (map + dashboard flottant)

app/(protected)/trafic/page.tsx       # prefetch SSR + <TraficContent initialData />
```

---

## 3. Flux de données

Architecture **100% client-side** : la page serveur ne fait plus aucun fetch, tout passe par le hook custom et React Query.

```
Server (page.tsx)            Client
┌─────────────────┐          ┌──────────────────────────────┐
│ <TraficContent/>│ ────────▶│ useTrafic()                  │
└─────────────────┘          │  ├── useTraficQuery()        │◀── refetchInterval 15s
                             │  │    queryKey               │
                             │  │    ['trafic','livreurs']  │
                             │  └── useRealtimeTrafic()     │◀── socket '/trafic/livreur/'
                             │        setQueryData(...)     │
                             └──────────────┬───────────────┘
                                            ▼
                              map + dashboard flottant
```

Les deux canaux (polling + socket) écrivent dans la même entrée de cache — **pas de double state**.

---

## 4. Détail des étapes

### 4.1 Types — `features/trafic/types/trafic.type.ts`
Réexporte `LivreurDisponible`, `LivreurTrafic`, `LivreurCategorie`, `TraficLivreursResponse` depuis `types/models.ts` et expose `EMPTY_TRAFIC_RESPONSE` (utile pour fallback réseau et pour `setQueryData` en cas de cache vide).

### 4.2 Request — `features/trafic/request/trafic.request.ts`
Déplace les appels HTTP hors des *server actions*. `getTraficDeliversRequest()` retourne `EMPTY_TRAFIC_RESPONSE` en cas d'échec (comportement identique à l'ancienne action).
> La *server action* `src/actions/trafic.actions.ts` a été supprimée car plus aucun consommateur n'en dépendait.

### 4.3 Query — `features/trafic/queries/trafic.query.ts`
- `traficQueryOption(initialData?)` : `queryKey ['trafic','livreurs']`, `staleTime: 15_000`, `refetchInterval: 15_000`. Le `setInterval` manuel disparaît.
- `useTraficQuery(initialData?)` : hook client, déclenche aussi un toast en cas d'erreur.
- `prefetchTraficQuery()` : exposé pour une utilisation future (prefetch SSR via `HydrationBoundary`) mais **pas utilisé par la page actuelle** — la page est 100% client-side.

### 4.4 Invalidation — `features/trafic/queries/index.query.ts`
`useInvalidateTraficQuery()` permet à d'autres features (ex. assignation de course) de forcer la resynchronisation du trafic sans se soucier du `queryKey`.

### 4.5 Realtime — `features/trafic/hooks/use-realtime-trafic.ts`
Avant : `useState<LivreurDisponible[]>` local, jamais câblé à la UI.
Après : écoute `'/trafic/livreur/'` et **patche directement** la `queryKey ['trafic','livreurs']` via `queryClient.setQueryData`. La règle de merge : si le livreur existe déjà dans une catégorie, on met à jour son enregistrement ; sinon on ne crée pas de doublon (le prochain poll de 15 s récupérera la bonne catégorie).

### 4.6 Hook composite — `features/trafic/hooks/use-trafic.ts`
Regroupe : la query, le realtime, l'état UI (`selectedLivreurId`, `openDashboard`) et le calcul mémoïsé de `positions`. Le composant n'a plus que du JSX.

### 4.7 Composant — `features/trafic/components/trafic-content.tsx`
Reprend le JSX de l'ancien `content.tsx` sans les `useState`/`useEffect` de data-fetching. `MapLeaflet` reste monté en `dynamic({ ssr: false })`.

### 4.8 Page — `app/(protected)/trafic/page.tsx`
```tsx
export default function Page() {
  return <TraficContent />;
}
```
Aucun fetch serveur : la page est un simple conteneur et délègue **tout** le chargement des données à `useTrafic()` côté client. Le premier render affiche un état vide (`EMPTY_TRAFIC_RESPONSE`) pendant quelques centaines de ms avant que la query React Query ne résolve.

### 4.9 Correctif Leaflet — `components/dashboard/trafic/MapLeaflet.tsx`
Le bug **« Map container is already initialized »** venait du fait que le `useEffect` avait `[positions]` en deps et ré-initialisait la carte à chaque mise à jour. Désormais :
- `useEffect([])` : instancie la carte **une seule fois** au mount, crée un `L.layerGroup()` pour les marqueurs, cleanup au unmount.
- `useEffect([positions])` : `layer.clearLayers()` puis ajout des nouveaux marqueurs.
- `fitBounds` ne s'exécute qu'au premier rendu avec des positions (évite de ré-zoomer à chaque tick).

---

## 5. Check-list de non-régression

- [ ] La page affiche les 3 listes (disponibles / indisponibles / en activité) et le total.
- [ ] Les marqueurs apparaissent sur la carte et correspondent aux livreurs avec lat/lon ≠ 0.
- [ ] Un rechargement de page ne déclenche plus le flash 403 (cf. fix CASL).
- [ ] Les données se rafraîchissent automatiquement toutes les 15 s (`Network` tab).
- [ ] Les mises à jour socket modifient les marqueurs sans rechargement complet.
- [ ] Plus aucune erreur console « Map container is already initialized ».
- [ ] Le dashboard flottant s'ouvre/ferme et la sélection d'un livreur affiche ses infos.

---

## 6. Extensions possibles

- Brancher `useInvalidateTraficQuery()` depuis les mutations d'assignation pour forcer un refetch immédiat.
- Désactiver le `refetchInterval` quand `isRealtimeConnected` est `true` (économiser des appels réseau).
- Ajouter un hook `useTraficFilters` (restaurant, zone, statut) sur le modèle de `features/tickets/filters`.
