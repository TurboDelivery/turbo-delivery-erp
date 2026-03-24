# Congé Feature

Cette fonctionnalité gère la gestion des congés et absences des employés dans le système ERP.

## Structure

```
features/conge/
├── README.md                 # Documentation
├── apis/                     # API endpoints
│   └── conge.api.ts         # Interface et implémentation API
├── filters/                  # Filtres et utilitaires de recherche
│   └── conge.filter.ts      # Fonctions de filtrage et tri
├── hooks/                    # Hooks React personnalisés
│   └── use-conge-table.ts   # Hook pour la gestion de table
├── queries/                  # React Query hooks
│   └── conge.query.ts       # Queries et mutations
├── schema/                   # Schémas de validation
│   ├── index.ts             # Export des schémas
│   └── conge.schema.ts      # Schémas Zod
├── types/                    # Types TypeScript
│   └── conge.type.ts        # Interfaces et enums
└── utils/                    # Utilitaires
    └── conge.utils.ts        # Fonctions utilitaires
```

## Types principaux

### IConge
Interface principale pour un congé avec toutes les propriétés nécessaires.

### CongeType
Enum pour les types de congé:
- `ANNUEL` - Congé annuel
- `MALADIE` - Congé maladie  
- `SANS_SOLDE` - Congé sans solde

### CongeStatut
Enum pour les statuts de congé:
- `EN_COURS` - En cours
- `TERMINE` - Terminé
- `EN_ATTENTE` - En attente
- `APPROUVEE` - Approuvée
- `REJETEE` - Rejetée

### DurationType
Enum pour les types de durée:
- `MOIS` - 30 jours
- `QUINZAINE` - 15 jours
- `SEMAINE` - 7 jours
- `PERSONNALISE` - Durée personnalisée

## API

### Méthodes principales
- `obtenirTousConges()` - Récupérer tous les congés
- `obtenirConge(id)` - Récupérer un congé spécifique
- `ajouterConge(data)` - Créer un nouveau congé
- `modifierConge(id, data)` - Mettre à jour un congé
- `supprimerConge(id)` - Supprimer un congé
- `approuverConge(id)` - Approuver un congé
- `rejeterConge(id)` - Rejeter un congé
- `obtenirCongesParEmploye(employeeId)` - Récupérer les congés d'un employé

## Hooks React

### Queries
- `useCongesQuery(params)` - Récupérer les congés avec filtres
- `useCongeQuery(id)` - Récupérer un congé spécifique
- `useCongesByEmployeeQuery(employeeId)` - Récupérer les congés d'un employé

### Mutations
- `useCreateCongeMutation()` - Créer un congé
- `useUpdateCongeMutation()` - Mettre à jour un congé
- `useDeleteCongeMutation()` - Supprimer un congé
- `useApproveCongeMutation()` - Approuver un congé
- `useRejectCongeMutation()` - Rejeter un congé

## Utilitaires

### CongeUtils
Classe utilitaire avec des fonctions pour:
- Calculer la durée entre deux dates
- Calculer la date de fin selon le type de durée
- Formater les dates
- Valider les plages de dates
- Vérifier si un congé est actif/upcoming/completed
- Générer des résumés

### CongeFilter
Classe de filtrage avec des fonctions pour:
- Appliquer des filtres multiples
- Rechercher par texte
- Trier les résultats
- Extraire les valeurs uniques

## Validation

Les schémas Zod assurent la validation des données:
- `CongeAddSchema` - Validation pour la création
- `CongeUpdateSchema` - Validation pour la mise à jour
- `CongeStatusUpdateSchema` - Validation pour les changements de statut

## Usage

```typescript
import { useCongesQuery, useCreateCongeMutation } from '@/features/conge/queries/conge.query';
import { CongeUtils } from '@/features/conge/utils/conge.utils';

// Récupérer les congés
const { data: conges, isLoading } = useCongesQuery({ statut: 'EN_ATTENTE' });

// Créer un congé
const createMutation = useCreateCongeMutation();
const handleCreate = (data) => createMutation.mutate(data);

// Utilitaires
const duration = CongeUtils.calculateDuration(startDate, endDate);
const endDate = CongeUtils.calculateEndDate(startDate, 'mois');
```
