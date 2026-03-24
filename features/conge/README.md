# Feature Congé

Ce dossier contient toute la logique métier pour la gestion des congés dans l'application TURBO Delivery ERP.

## Structure du dossier

```
features/conge/
├── README.md                 # Documentation du module
├── actions/                 # Actions serveur Next.js
│   └── conge.action.ts   # Actions pour les opérations CRUD
├── apis/                    # Interface et implémentation API
│   └── conge.api.ts      # Client API pour les congés
├── hooks/                    # Hooks React personnalisés
│   └── use-conge-table.ts # Hook pour la gestion des tables
├── mutations/                # Mutations React Query
│   ├── conge.mutation.ts # Mutations CRUD
│   └── index.query.ts     # Utilitaires pour invalidations
├── queries/                   # Queries React Query
│   └── conge.query.ts      # Hooks pour récupérer les données
├── schemas/                   # Schémas Zod
│   └── conge.schema.ts    # Validation des formulaires
├── types/                     # Types TypeScript
│   └── conge.type.ts      # Interfaces et enums
└── utils/                     # Utilitaires métier
    └── conge.utils.ts      # Fonctions utilitaires
```

## Types et Interfaces

### Enums
- `CongeType`: Types de congé (annuel, maladie, sans solde)
- `CongeStatut`: Statuts possibles (en attente, approuvée, en cours, terminé, rejetée)
- `DurationType`: Types de durée (mois, quinzaine, semaine, personnalisé)

### Interfaces principales
- `IConge`: Structure d'un congé
- `ICongesParams`: Paramètres pour les requêtes paginées
- `ICongeAddUpdateResponse`: Réponse des opérations CRUD
- `ICongeDeleteResponse`: Réponse de suppression

## API Client

### Endpoints disponibles
- `obtenirTousConges(params)`: Récupérer tous les congés (paginé)
- `obtenirConge(id)`: Récupérer un congé spécifique
- `ajouterConge(data)`: Créer un nouveau congé
- `modifierConge(id, data)`: Mettre à jour un congé
- `supprimerConge(id)`: Supprimer un congé
- `approuverConge(id, data?)`: Approuver un congé
- `rejeterConge(id, data?)`: Rejeter un congé
- `obtenirCongesParEmploye(employeeId)`: Récupérer les congés d'un employé

### Configuration
- Base URL: `/conges`
- Méthodes: GET, POST, PATCH, DELETE
- Validation via schémas Zod

## React Query Hooks

### Queries
- `useCongesQuery(params)`: Récupérer la liste des congés
- `useCongeQuery(id)`: Récupérer un congé spécifique
- `useCongesByEmployeeQuery(employeeId)`: Récupérer les congés d'un employé

### Mutations
- `useAjouterCongeMutation()`: Créer un congé
- `useModifierCongeMutation()`: Mettre à jour un congé
- `useSupprimerCongeMutation()`: Supprimer un congé
- `useApprouverCongeMutation()`: Approuver un congé
- `useRejeterCongeMutation()`: Rejeter un congé

### Fonctionnalités
- Validation automatique des formulaires
- Gestion des erreurs avec toast notifications
- Invalidations automatiques du cache
- Support des paramètres de recherche et filtrage

## Actions Serveur

### Opérations disponibles
- `ajouterCongeAction(data)`: Ajouter un congé
- `modifierCongeAction(id, data)`: Modifier un congé
- `supprimerCongeAction(id)`: Supprimer un congé
- `approuverCongeAction(id, data?)`: Approuver un congé
- `rejeterCongeAction(id, data?)`: Rejeter un congé

### Gestion des erreurs
- Try/catch pour toutes les opérations
- Format de réponse standardisé
- Logging des erreurs

## Schémas de Validation

### Schémas Zod
- `CongeAddSchema`: Validation pour la création
- `CongeUpdateSchema`: Validation pour la modification
- `CongeStatusUpdateSchema`: Validation pour le changement de statut

### Types exportés
- `CongeAddDTO`: Type pour l'ajout
- `CongeUpdateDTO`: Type pour la modification
- `CongeStatusUpdateDTO`: Type pour le changement de statut

## Hooks Personnalisés

### useCongeTable
Hook complet pour la gestion des tables de congés avec:
- Gestion de la pagination
- Filtrage par type, statut, recherche
- Sélection multiple
- Tri personnalisé
- Reset des filtres

### Props disponibles
```typescript
interface UseCongeTableParams {
  initialParams?: ICongesParams;
  itemsPerPage?: number;
}
```

### Retour du hook
```typescript
{
  // État
  params, computedParams, selectedConges, filters,
  currentPage, totalPages, totalItems,
  
  // Actions
  updateParams, updateFilters, nextPage, prevPage,
  toggleCongeSelection, selectAllConges, clearSelection, resetFilters,
  
  // Query key
  queryKey
}
```

## Utilitaires Métier

### CongeUtils
Classe statique avec des méthodes utilitaires:

#### Manipulation de dates
- `formatDate(dateString)`: Formater une date en français
- `calculateDuration(startDate, endDate)`: Calculer la durée en jours
- `calculateDatesFromDuration(durationType, startDate?)`: Calculer dates automatiques
- `validateDates(startDate, endDate)`: Valider la cohérence des dates

#### Gestion des états
- `getCongeTypeLabel(type)`: Libellé du type
- `getCongeStatutLabel(statut)`: Libellé du statut
- `getCongeStatutColor(statut)`: Couleur du statut
- `isCongeEnCours(conge)`: Vérifier si en cours
- `isCongeAVenir(conge)`: Vérifier si à venir

#### Traitement des données
- `getEmployeeInitials(name)`: Générer les initiales
- `filterConges(conges, filters)`: Filtrer la liste
- `sortConges(conges, sortBy, direction)`: Trier les données
- `getUniqueTypes(conges)`: Types uniques
- `getUniqueStatuts(conges)`: Statuts uniques

## Utilisation Recommandée

### Dans un composant React
```typescript
import { useCongesQuery, useAjouterCongeMutation } from '@/features/conge/queries/conge.query';
import { useCongeTable } from '@/features/conge/hooks/use-conge-table';
import { CongeUtils } from '@/features/conge/utils/conge.utils';

const MyComponent = () => {
  // Récupérer les congés
  const { data, isLoading, error } = useCongesQuery({
    type: CongeType.ANNUEL,
    statut: CongeStatut.APPROUVEE
  });

  // Hook de table
  const table = useCongeTable({
    itemsPerPage: 20
  });

  // Mutation pour ajouter
  const addMutation = useAjouterCongeMutation();

  return (
    // Votre JSX
  );
};
```

### Dans une action serveur
```typescript
import { ajouterCongeAction } from '@/features/conge/actions/conge.action';

export const myServerAction = async (formData: FormData) => {
  const data = {
    employeeId: formData.get('employeeId'),
    type: formData.get('type'),
    // ... autres champs
  };

  return await ajouterCongeAction(data);
};
```

## Bonnes Pratiques

1. **Utiliser les hooks React Query** pour la gestion des données
2. **Valider les formulaires** avec les schémas Zod fournis
3. **Gérer les erreurs** avec les mutations et les toasts
4. **Utiliser CongeUtils** pour les opérations métier communes
5. **Respecter les types TypeScript** pour la sécurité du code
6. **Utiliser les query keys** pour l'invalidation du cache

## Dépendances

- React Query (@tanstack/react-query)
- Zod (validation)
- Sonner (notifications)
- ak-api-http (client API)
- TypeScript (types)
