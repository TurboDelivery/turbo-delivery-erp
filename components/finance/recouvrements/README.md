# Composants Recouvrements

Ce dossier contient tous les composants liés aux recouvrements.

## Structure

```
recouvrements/
├── common/                      # Composants réutilisables
│   ├── restaurant-select.tsx    # Select pour filtrer par restaurant
│   └── index.ts
├── factures/                    # Composants des factures
│   ├── facture-tabs-content.tsx
│   └── facture-table.tsx
├── recouvrements/              # Composants des recouvrements
│   └── recouvrement-table.tsx  # Tableau des recouvrements avec filtres
├── restaurants/                # Composants des restaurants
│   └── restaurants-table.tsx
└── recouvrement-content-tabs.tsx  # Onglets principaux
```

## Utilisation

### RestaurantSelect

Composant réutilisable pour sélectionner un restaurant avec react-select.

```tsx
<RestaurantSelect
  value={restaurantId}
  onChange={(value) => setRestaurantId(value || '')}
  options={restaurantOptions}
  isLoading={isLoading}
  placeholder="Sélectionner un restaurant"
/>
```

### RecouvrementTable

Tableau complet des recouvrements avec filtres et pagination.

```tsx
<RecouvrementTable
  restoOpts={restaurantOptions}
  isOptionsLoading={isRestaurantsLoading}
/>
```

## Features

Les hooks, filtres, colonnes et queries sont dans le dossier `features/recouvrements/` :

- `filters/` - Filtres nuqs pour les URL
- `columns/` - Définitions des colonnes pour les tableaux
- `hooks/` - Hooks personnalisés pour les tableaux
- `queries/` - React Query hooks
- `apis/` - Appels API

