# Structure des Données - Rapport de Performance

## Vue d'Ensemble

Ce document décrit la structure des données attendues par le composant `PerformanceReport.tsx` pour afficher les rapports de performance de livraison.

---

## 1. KPIs Principaux (3 Cards du Haut)

### Endpoint Suggéré
```
GET /api/analytics/performance/kpis
```

### Paramètres
- `debut`: Date (YYYY-MM-DD) - Date de début
- `fin`: Date (YYYY-MM-DD) - Date de fin

### Structure de Réponse
```typescript
interface MainKPIsResponse {
  totalDeliveries: number;      // Nombre de Livraisons
  totalOrderValue: number;      // Valeur Totale des Commandes (FCFA)
  successRate: number;          // Taux de Succès (%)
}
```

### Exemple de Réponse
```json
{
  "totalDeliveries": 352,
  "totalOrderValue": 3745243,
  "successRate": 94.5
}
```

---

## 2. Données Géographiques (Performance par Zone)

### Endpoint Suggéré
```
GET /api/analytics/performance/geographic
```

### Paramètres
- `debut`: Date (YYYY-MM-DD) - Date de début
- `fin`: Date (YYYY-MM-DD) - Date de fin

### Structure de Réponse
```typescript
interface GeographicPerformanceResponse {
  geographicData: GeographicData[];
}

interface GeographicData {
  name: string;        // Nom de la zone (ex: "Marcory", "Zone 4", "Plateau")
  value: number;       // Pourcentage de livraisons (ex: 36)
  deliveries: number;  // Nombre de livraisons (ex: 128)
  color: string;       // Couleur pour le graphique (ex: "#3B82F6")
}
```

### Exemple de Réponse
```json
{
  "geographicData": [
    { "name": "Marcory", "value": 36, "deliveries": 128, "color": "#3B82F6" },
    { "name": "Zone 4", "value": 24, "deliveries": 87, "color": "#8B5CF6" },
    { "name": "Plateau", "value": 21, "deliveries": 75, "color": "#EC4899" },
    { "name": "Cocody", "value": 10, "deliveries": 36, "color": "#F59E0B" },
    { "name": "Yopougon", "value": 9, "deliveries": 33, "color": "#10B981" }
  ]
}
```

---

## 3. Pics d'Activité Hebdomadaire

### Endpoint Suggéré
```
GET /api/analytics/performance/weekly
```

### Paramètres
- `debut`: Date (YYYY-MM-DD) - Date de début de la semaine
- `fin`: Date (YYYY-MM-DD) - Date de fin de la semaine

### Structure de Réponse
```typescript
interface WeeklyPerformanceResponse {
  weeklyData: WeeklyData[];
}

interface WeeklyData {
  day: string;         // Jour de la semaine (ex: "Lundi", "Mardi")
  deliveries: number;  // Nombre de livraisons ce jour
  revenue: number;     // Chiffre d'affaires ce jour (en FCFA)
}
```

### Exemple de Réponse
```json
{
  "weeklyData": [
    { "day": "Lundi", "deliveries": 45, "revenue": 580000 },
    { "day": "Mardi", "deliveries": 38, "revenue": 420000 },
    { "day": "Mercredi", "deliveries": 52, "revenue": 510000 },
    { "day": "Jeudi", "deliveries": 41, "revenue": 400000 },
    { "day": "Vendredi", "deliveries": 43, "revenue": 400000 },
    { "day": "Samedi", "deliveries": 68, "revenue": 720000 },
    { "day": "Dimanche", "deliveries": 65, "revenue": 715000 }
  ]
}
```

---

## 4. KPIs Secondaires (3 Cards du Milieu)

### Endpoint Suggéré
```
GET /api/analytics/performance/secondary-kpis
```

### Paramètres
- `debut`: Date (YYYY-MM-DD) - Date de début
- `fin`: Date (YYYY-MM-DD) - Date de fin

### Structure de Réponse
```typescript
interface SecondaryKPIsResponse {
  averageDeliveryTime: number;  // Temps Moyen de Livraison (minutes)
  monthlyGrowth: number;       // Croissance Mensuelle (%)
  averageItemsPerOrder: number;  // Articles par Commande
}
```

### Exemple de Réponse
```json
{
  "averageDeliveryTime": 28.5,
  "monthlyGrowth": 12.3,
  "averageItemsPerOrder": 3.2
}
```

---

## 5. Détails Financiers

### Endpoint Suggéré
```
GET /api/analytics/performance/financial-details
```

### Paramètres
- `debut`: Date (YYYY-MM-DD) - Date de début
- `fin`: Date (YYYY-MM-DD) - Date de fin

### Structure de Réponse
```typescript
interface FinancialDetailsResponse {
  totalOrderAmount: number;           // Montant total des commandes
  deliveryFeesCollected: number;      // Frais de livraison collectés
  turboDeliveryServiceFees: number;  // Frais de service Turbo Delivery (10%)
  partnerNetRevenue: number;          // Revenu net du partenaire
}
```

### Exemple de Réponse
```json
{
  "totalOrderAmount": 3745243,
  "deliveryFeesCollected": 360347,
  "turboDeliveryServiceFees": 374363,
  "partnerNetRevenue": 3000533
}
```

---

## 6. Hook React Query Attendu

### Fichier: `performance.query.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// KPIs Principaux
interface MainKPIsResponse {
  totalDeliveries: number;
  totalOrderValue: number;
  successRate: number;
}

// Données Géographiques
interface GeographicData {
  name: string;
  value: number;
  deliveries: number;
  color: string;
}

// Données Hebdomadaires
interface WeeklyData {
  day: string;
  deliveries: number;
  revenue: number;
}

// KPIs Secondaires
interface SecondaryKPIsResponse {
  averageDeliveryTime: number;
  monthlyGrowth: number;
  averageItemsPerOrder: number;
}

// Détails Financiers
interface FinancialDetailsResponse {
  totalOrderAmount: number;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  partnerNetRevenue: number;
}

// Hooks
export const useMainKPIsQuery = (params?: { debut?: Date; fin?: Date }) => {
  return useQuery({
    queryKey: ['mainKPIs', params],
    queryFn: () => api.request<MainKPIsResponse>({
      endpoint: '/api/analytics/performance/kpis',
      method: 'GET',
      searchParams: params,
    }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGeographicPerformanceQuery = (params?: { debut?: Date; fin?: Date }) => {
  return useQuery({
    queryKey: ['geographicPerformance', params],
    queryFn: () => api.request<{ geographicData: GeographicData[] }>({
      endpoint: '/api/analytics/performance/geographic',
      method: 'GET',
      searchParams: params,
    }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useWeeklyPerformanceQuery = (params?: { debut?: Date; fin?: Date }) => {
  return useQuery({
    queryKey: ['weeklyPerformance', params],
    queryFn: () => api.request<{ weeklyData: WeeklyData[] }>({
      endpoint: '/api/analytics/performance/weekly',
      method: 'GET',
      searchParams: params,
    }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSecondaryKPIsQuery = (params?: { debut?: Date; fin?: Date }) => {
  return useQuery({
    queryKey: ['secondaryKPIs', params],
    queryFn: () => api.request<SecondaryKPIsResponse>({
      endpoint: '/api/analytics/performance/secondary-kpis',
      method: 'GET',
      searchParams: params,
    }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFinancialDetailsQuery = (params?: { debut?: Date; fin?: Date }) => {
  return useQuery({
    queryKey: ['financialDetails', params],
    queryFn: () => api.request<FinancialDetailsResponse>({
      endpoint: '/api/analytics/performance/financial-details',
      method: 'GET',
      searchParams: params,
    }),
    staleTime: 5 * 60 * 1000,
  });
};
```

---

## 7. Intégration dans le Composant

### Utilisation des hooks dans `PerformanceReport.tsx`
```typescript
// Import des hooks
import { 
  useMainKPIsQuery,
  useGeographicPerformanceQuery,
  useWeeklyPerformanceQuery,
  useSecondaryKPIsQuery,
  useFinancialDetailsQuery 
} from './performance.query';

// Utilisation dans le composant
const { data: mainKPIs } = useMainKPIsQuery({ debut, fin });
const { data: geographicData } = useGeographicPerformanceQuery({ debut, fin });
const { data: weeklyData } = useWeeklyPerformanceQuery({ debut, fin });
const { data: secondaryKPIs } = useSecondaryKPIsQuery({ debut, fin });
const { data: financialDetails } = useFinancialDetailsQuery({ debut, fin });

// Remplacer les données codées en dur:
const geographicPerformance = geographicData?.geographicData || [];
const weeklyPerformance = weeklyData?.weeklyData || [];

// Utiliser dans les cards:
// Cards du haut: mainKPIs.totalDeliveries, mainKPIs.totalOrderValue, mainKPIs.successRate
// Cards du milieu: secondaryKPIs.averageDeliveryTime, secondaryKPIs.monthlyGrowth, secondaryKPIs.averageItemsPerOrder
// Détails financiers: financialDetails.totalOrderAmount, financialDetails.deliveryFeesCollected, etc.
```

---

## 8. Tests Suggérés

### Test Postman
```bash
# KPIs Principaux
GET https://backend-prod.turbodeliveryapp.com/api/analytics/performance/kpis?debut=2026-03-01&fin=2026-03-31

# Données géographiques
GET https://backend-prod.turbodeliveryapp.com/api/analytics/performance/geographic?debut=2026-03-01&fin=2026-03-31

# Activité hebdomadaire
GET https://backend-prod.turbodeliveryapp.com/api/analytics/performance/weekly?debut=2026-03-01&fin=2026-03-31

# KPIs Secondaires
GET https://backend-prod.turbodeliveryapp.com/api/analytics/performance/secondary-kpis?debut=2026-03-01&fin=2026-03-31

# Détails financiers
GET https://backend-prod.turbodeliveryapp.com/api/analytics/performance/financial-details?debut=2026-03-01&fin=2026-03-31
```

---

## 9. Notes Importantes

- **Authentification**: Tous les endpoints nécessitent une authentification valide
- **Format des dates**: Utiliser le format YYYY-MM-DD
- **Unités**: 
  - Montants en FCFA
  - Pourcentages en valeur décimale (ex: 94.5 pour 94.5%)
  - Temps en minutes
- **Performance**: Prévoir des indexes sur les tables de livraisons pour optimiser les requêtes
- **Calculs**: 
  - `turboDeliveryServiceFees` = 10% du `totalOrderAmount`
  - `partnerNetRevenue` = `totalOrderAmount` - `deliveryFeesCollected` - `turboDeliveryServiceFees`

---

## 10. Priorités

1. **Critique**: KPIs Principaux, Données géographiques, Activité hebdomadaire
2. **Important**: KPIs Secondaires, Détails financiers
3. **Optionnel**: Filtres supplémentaires (types de livraison, etc.)

---

*Ce document sera mis à jour au fur et à mesure des besoins spécifiques du projet.*
