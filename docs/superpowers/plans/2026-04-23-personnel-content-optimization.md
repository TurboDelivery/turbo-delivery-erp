# Personnel Content Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer les données statiques inlinées, supprimer le code commenté JSX, et brancher le composant `RequestManagement` sur de vraies données API.

**Architecture:** On extrait les constantes au niveau module, on active la query leave-request commentée, et on passe les vraies données au composant.

**Tech Stack:** React, Next.js App Router, TanStack Query (`useQuery`)

---

## Carte des fichiers touchés

| Fichier | Action |
|---|---|
| `app/(protected)/personnel/personnel-content.tsx` | Modifier — extraire constantes, supprimer comments, simplifier handlers, brancher query |
| `features/personnel/queries/leave-request-list.query.ts` | Modifier — décommenter et activer les hooks |

---

### Task 1 : Extraire les données statiques hors du composant

**Problème :** `departments` et `postes` sont déclarés dans le corps du composant → recréés à chaque render sans raison.

**Fichiers :**
- Modify: `app/(protected)/personnel/personnel-content.tsx`

- [ ] **Step 1 : Déplacer `departments` et `postes` au niveau module**

Remplacer les déclarations dans le composant par des constantes au niveau du fichier, juste après les imports :

```tsx
const DEPARTMENTS = [
  { id: '1', name: 'RESSOURCES HUMAINES' },
  { id: '2', name: 'COMMUNICATION - MARKETING' },
  { id: '3', name: 'DEVELOPPEMENT' },
  { id: '4', name: 'COMMERCIAL' },
  { id: '5', name: 'OPERATIONS' },
  { id: '6', name: 'DIRECTION' },
  { id: '7', name: 'TECHNIQUE' },
  { id: '8', name: 'LOGISTIQUE' },
  { id: '9', name: 'INFORMATIQUE' },
];

const POSTES = [
  'DIRECTEUR GENERAL',
  'DIRECTEUR GENERAL ADJOINT',
  'RESPONSABLE DES OPERATIONS',
  'RESPONSABLE COMPTABLE',
  'RESPONSABLE DES RECOUVREMENTS',
  'CHEF AUX OPERATIONS',
  'STANDARDISTE',
  "AGENT DE LA CENTRALE D'APPEL",
  'SUPERVISEURS',
  'DISPATCHERS',
  'DISPACTHEUSES',
  'SERVICE AUTHENTIFICATION ET VERIFICATION DE COUPONS',
  'DEVELOPPEUR',
  'CM - MARKETING',
  'SECRETAIRE DE DIRECTION',
  'Turboy Journalier',
  'ménagère',
];
```

Supprimer les déclarations `departments` et `postes` dans le corps du composant et mettre à jour les références dans le JSX (`departments={DEPARTMENTS}`, `postes={POSTES}`).

- [ ] **Step 2 : Vérifier que le composant compile sans erreur**

```bash
rtk tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
rtk git add app/(protected)/personnel/personnel-content.tsx
rtk git commit -m "refactor: hoist static departments and postes to module level"
```

---

### Task 2 : Supprimer le code JSX commenté (onglet "demande")

**Problème :** Le `TabsTrigger value="demande"` et son `TabsContent` sont commentés dans le JSX, ce qui est du code mort.

**Fichiers :**
- Modify: `app/(protected)/personnel/personnel-content.tsx`

- [ ] **Step 1 : Supprimer les blocs commentés dans le JSX**

Supprimer la ligne suivante dans `TabsList` :
```tsx
{/* <TabsTrigger value="demande">Demandes</TabsTrigger> */}
```

Et supprimer le bloc suivant après `TabsContent value="employees"` :
```tsx
{/* <TabsContent value="demande" className="mt-6">
  <LeaveManagement leaveRequests={leaveRequests} leaveStats={leaveStats} />
</TabsContent> */}
```

- [ ] **Step 2 : Commit**

```bash
rtk git add app/(protected)/personnel/personnel-content.tsx
rtk git commit -m "chore: remove commented-out demande tab JSX"
```

---

### Task 3 : Simplifier le handler `handleAddEmployee`

**Problème :** `handleAddEmployee` est un wrapper inutile — il ne fait qu'appeler `mutate` directement.

**Fichiers :**
- Modify: `app/(protected)/personnel/personnel-content.tsx`

- [ ] **Step 1 : Supprimer le handler et inliner dans le JSX**

Supprimer la fonction :
```tsx
const handleAddEmployee = (newEmployee: EmployeeCreateDTO) => {
  ajouterEmployeMutation.mutate(newEmployee);
};
```

Dans le JSX, remplacer `onAddEmployee={handleAddEmployee}` par :
```tsx
onAddEmployee={(newEmployee) => ajouterEmployeMutation.mutate(newEmployee)}
```

Et dans `AddEmployeeModal`, pareil — `onAddEmployee` dans le JSX :
```tsx
onAddEmployee={(newEmployee) => ajouterEmployeMutation.mutate(newEmployee)}
```

- [ ] **Step 2 : Supprimer l'import `EmployeeCreateDTO` si devenu inutilisé**

Vérifier que `EmployeeCreateDTO` n'est plus utilisé dans le fichier et supprimer son import si c'est le cas :
```tsx
// Supprimer cette ligne si plus utilisée :
import { EmployeeCreateDTO } from '@/features/personnel/schemas/employee.schema';
```

- [ ] **Step 3 : Vérifier compilation**

```bash
rtk tsc --noEmit
```

- [ ] **Step 4 : Commit**

```bash
rtk git add app/(protected)/personnel/personnel-content.tsx
rtk git commit -m "refactor: inline handleAddEmployee mutation call"
```

---

### Task 4 : Activer la query leave-request et brancher `RequestManagement` sur les vraies données

**Problème :** `requests` et `requestStats` sont des données mock hardcodées. La query existe dans `leave-request-list.query.ts` mais est entièrement commentée. `RequestManagement` reçoit aussi `employees={[]}`.

**Fichiers :**
- Modify: `features/personnel/queries/leave-request-list.query.ts`
- Modify: `app/(protected)/personnel/personnel-content.tsx`

- [ ] **Step 1 : Décommenter et activer `useLeaveRequestListQuery`**

Remplacer le contenu entièrement commenté de `features/personnel/queries/leave-request-list.query.ts` par :

```ts
import { useQuery } from '@tanstack/react-query';
import { leaveRequestAPI, ILeaveRequestParams } from '@/features/personnel/apis/leave-request.api';
import { LeaveRequest } from '@/features/personnel/types/types';
import { PaginatedResponse } from '@/types/general';

export const useLeaveRequestListQuery = (params: ILeaveRequestParams) => {
  return useQuery<PaginatedResponse<LeaveRequest>>({
    queryKey: ['leave-requests', params],
    queryFn: () => leaveRequestAPI.obtenirToutesDemandes(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
```

- [ ] **Step 2 : Vérifier que l'API et les types correspondent**

Lire `features/personnel/apis/leave-request.api.ts` et confirmer que `ILeaveRequestParams` et `obtenirToutesDemandes` existent et sont exportés. Si des noms diffèrent, adapter l'import.

- [ ] **Step 3 : Brancher le hook dans `personnel-content.tsx`**

Ajouter l'import :
```tsx
import { useLeaveRequestListQuery } from '@/features/personnel/queries/leave-request-list.query';
```

Remplacer les données hardcodées `requests` et `requestStats` par les données du hook :

```tsx
const { data: leaveData } = useLeaveRequestListQuery({});
const requests = leaveData?.data ?? [];
const requestStats: RequestStats = {
  pending: requests.filter((r) => r.statut === 'En attente').length,
  approved: requests.filter((r) => r.statut === 'Approuvée').length,
  rejected: requests.filter((r) => r.statut === 'Rejetée').length,
};
```

Supprimer le bloc de données mock hardcodées (lignes 61–116 actuels).

- [ ] **Step 4 : Supprimer les imports devenus inutilisés**

Si `LeaveRequest` n'est plus utilisé directement (le typage passe par le hook), le supprimer de l'import :
```tsx
// Supprimer LeaveRequest de l'import si inutilisé :
import { IEmployee, RequestStats } from '@/features/personnel/types/types';
```

- [ ] **Step 5 : Vérifier compilation**

```bash
rtk tsc --noEmit
```

- [ ] **Step 6 : Commit**

```bash
rtk git add features/personnel/queries/leave-request-list.query.ts app/(protected)/personnel/personnel-content.tsx
rtk git commit -m "feat: connect RequestManagement to real leave-request API data"
```

---

## Self-Review

**Couverture spec :**
- ✅ Task 1 : données statiques extraites hors render
- ✅ Task 2 : code JSX commenté supprimé
- ✅ Task 3 : handler inutile supprimé
- ✅ Task 4 : données mock remplacées par API réelle

**Risques :**
- Task 4 dépend de `ILeaveRequestParams` — à vérifier au step 2 avant d'aller plus loin
- `employees={[]}` dans `RequestManagement` reste non branché (hors scope, à traiter séparément si nécessaire)
