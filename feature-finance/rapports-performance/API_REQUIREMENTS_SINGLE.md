# Structure des Données - Rapport de Performance (Endpoint Unique)

## Endpoint Principal

### URL
```
GET /api/analytics/performance
```

### Paramètres
- `debut`: Date (YYYY-MM-DD) - Date de début
- `fin`: Date (YYYY-MM-DD) - Date de fin

---

## Structure Complète de Réponse

```typescript
interface PerformanceReportResponse {
  // KPIs Principaux (3 Cards du Haut)
  mainKPIs: {
    totalDeliveries: number;      // Nombre total de livraisons effectuées sur la période
    totalOrderValue: number;      // Valeur totale des commandes en FCFA
    successRate: number;          // Taux de succès des livraisons en pourcentage (ex: 94.5)
  };

  // Données Géographiques (Graphique par zone)
  geographicData: {
    name: string;        // Nom de la zone géographique (ex: "Marcory", "Zone 4", "Plateau")
    value: number;       // Pourcentage de livraisons pour cette zone (0-100)
    deliveries: number;  // Nombre de livraisons effectuées dans cette zone
    color: string;       // Code couleur hexadécimal pour le graphique (ex: "#3B82F6")
  }[];

  // Pics d'Activité Hebdomadaire (Graphique d'activité)
  weeklyActivity: {
    day: string;         // Jour de la semaine en français (ex: "Lundi", "Mardi")
    deliveries: number;  // Nombre de livraisons effectuées ce jour
    revenue: number;     // Chiffre d'affaires généré ce jour en FCFA
  }[];

  // KPIs Secondaires (3 Cards du Milieu)
  secondaryKPIs: {
    averageDeliveryTime: number;  // Temps moyen de livraison en minutes (ex: 28.5)
    monthlyGrowth: number;       // Croissance mensuelle en pourcentage (ex: 12.3)
    averageItemsPerOrder: number; // Nombre moyen d'articles par commande (ex: 3.2)
  };

  // Détails Financiers (Section financière)
  financialDetails: {
    totalOrderAmount: number;           // Montant total des commandes en FCFA
    deliveryFeesCollected: number;      // Montant total des frais de livraison collectés en FCFA
    turboDeliveryServiceFees: number;  // Frais de service Turbo Delivery (10% du totalOrderAmount) en FCFA
    partnerNetRevenue: number;          // Revenu net du partenaire après déduction des frais en FCFA
  };
}
```

---

## Exemple Complet de Réponse JSON

```json
{
  "mainKPIs": {
    "totalDeliveries": 352,
    "totalOrderValue": 3745243,
    "successRate": 94.5
  },
  "geographicData": [
    {
      "name": "Marcory",
      "value": 36,
      "deliveries": 128,
      "color": "#3B82F6"
    },
    {
      "name": "Zone 4",
      "value": 24,
      "deliveries": 87,
      "color": "#8B5CF6"
    },
    {
      "name": "Plateau",
      "value": 21,
      "deliveries": 75,
      "color": "#EC4899"
    },
    {
      "name": "Cocody",
      "value": 10,
      "deliveries": 36,
      "color": "#F59E0B"
    },
    {
      "name": "Yopougon",
      "value": 9,
      "deliveries": 33,
      "color": "#10B981"
    }
  ],
  "weeklyActivity": [
    {
      "day": "Lundi",
      "deliveries": 45,
      "revenue": 580000
    },
    {
      "day": "Mardi",
      "deliveries": 38,
      "revenue": 420000
    },
    {
      "day": "Mercredi",
      "deliveries": 52,
      "revenue": 510000
    },
    {
      "day": "Jeudi",
      "deliveries": 41,
      "revenue": 400000
    },
    {
      "day": "Vendredi",
      "deliveries": 43,
      "revenue": 400000
    },
    {
      "day": "Samedi",
      "deliveries": 68,
      "revenue": 720000
    },
    {
      "day": "Dimanche",
      "deliveries": 65,
      "revenue": 715000
    }
  ],
  "secondaryKPIs": {
    "averageDeliveryTime": 28.5,
    "monthlyGrowth": 12.3,
    "averageItemsPerOrder": 3.2
  },
  "financialDetails": {
    "totalOrderAmount": 3745243,
    "deliveryFeesCollected": 360347,
    "turboDeliveryServiceFees": 374363,
    "partnerNetRevenue": 3000533
  }
}
```

---

## Hook React Query

### Fichier: `performance.query.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PerformanceReportResponse {
  mainKPIs: {
    totalDeliveries: number;
    totalOrderValue: number;
    successRate: number;
  };
  geographicData: {
    name: string;
    value: number;
    deliveries: number;
    color: string;
  }[];
  weeklyActivity: {
    day: string;
    deliveries: number;
    revenue: number;
  }[];
  secondaryKPIs: {
    averageDeliveryTime: number;
    monthlyGrowth: number;
    averageItemsPerOrder: number;
  };
  financialDetails: {
    totalOrderAmount: number;
    deliveryFeesCollected: number;
    turboDeliveryServiceFees: number;
    partnerNetRevenue: number;
  };
}

export const usePerformanceReportQuery = (params?: { debut?: Date; fin?: Date }) => {
  return useQuery({
    queryKey: ['performanceReport', params],
    queryFn: () => api.request<PerformanceReportResponse>({
      endpoint: '/api/analytics/performance',
      method: 'GET',
      searchParams: params,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
```

---

## Intégration dans le Composant

### Utilisation dans `PerformanceReport.tsx`
```typescript
import { usePerformanceReportQuery } from './performance.query';

// Dans le composant
const { data: performanceData, isLoading } = usePerformanceReportQuery({ debut, fin });

// Utilisation des données
const mainKPIs = performanceData?.mainKPIs;
const geographicData = performanceData?.geographicData || [];
const weeklyActivity = performanceData?.weeklyActivity || [];
const secondaryKPIs = performanceData?.secondaryKPIs;
const financialDetails = performanceData?.financialDetails;

// Cards du haut
mainKPIs?.totalDeliveries        // 352
mainKPIs?.totalOrderValue        // 3745243
mainKPIs?.successRate           // 94.5

// Cards du milieu
secondaryKPIs?.averageDeliveryTime  // 28.5
secondaryKPIs?.monthlyGrowth       // 12.3
secondaryKPIs?.averageItemsPerOrder // 3.2

// Détails financiers
financialDetails?.totalOrderAmount          // 3745243
financialDetails?.deliveryFeesCollected     // 360347
financialDetails?.turboDeliveryServiceFees   // 374363
financialDetails?.partnerNetRevenue         // 3000533
```

---

## Test Postman

```bash
GET https://backend-prod.turbodeliveryapp.com/api/analytics/performance?debut=2026-03-01&fin=2026-03-31
```

---

## Notes Importantes

### Calculs et Formules
- **Turbo Delivery Service Fees** = 10% du `totalOrderAmount`
- **Partner Net Revenue** = `totalOrderAmount` - `deliveryFeesCollected` - `turboDeliveryServiceFees`
- **Success Rate** = (livraisons réussies / livraisons totales) × 100

### Unités et Formats
- **Montants**: Toujours en FCFA (nombre entier)
- **Pourcentages**: Valeur décimale (ex: 94.5 pour 94.5%)
- **Temps**: En minutes avec décimales (ex: 28.5)
- **Couleurs**: Format hexadécimal (ex: "#3B82F6")

### Performance
- Utiliser des indexes sur les tables de livraisons, commandes et zones
- Prévoir du cache côté backend pour les requêtes fréquentes
- Optimiser les calculs pour éviter les requêtes N+1

### Authentification
- L'endpoint nécessite une authentification valide
- Les permissions doivent être vérifiées pour accéder aux données financières

---

*Ce format unifié simplifie l'intégration et réduit le nombre d'appels API nécessaires pour charger le rapport complet.*
