# Spécification des données — Dashboard Bilan Annuel

---

## 1. Paramètres de requête

**Endpoint suggéré :** `GET /api/erp/analytics/bilan-annuel?annee=2026`

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `annee` | `number` | ✅ | Année du bilan (ex: `2026`) |

---

## 2. Format des données retournées

### 2.1 Réponse globale

```typescript
interface IBilanAnnuelResponse {
  annee: number;
  mois: IMonthData[];
}
```

### 2.2 Données mensuelles (`IMonthData`)

| Champ | Type | Description |
|---|---|---|
| `month` | `string` | Identifiant du mois en minuscules (ex: `"janvier"`) |
| `monthName` | `string` | Libellé affiché (ex: `"Janvier 2026"`) |
| `courses` | `number` | Nombre de courses effectuées |
| `staff` | `number` | Nombre de membres du staff actifs |
| `ca` | `string` | Chiffre d'affaires formaté (ex: `"5 786 973 FCFA"`) |
| `expenses` | `string` | Total des dépenses formaté (ex: `"4 166 682 FCFA"`) |
| `reimbursements` | `string` | Total des remboursements formaté (ex: `"43 298 FCFA"`) |
| `investments` | `string` | Total des investissements formaté (ex: `"1 287 001 FCFA"`) |
| `progress` | `number` | Numéro du mois dans l'année (1 → 12) |
| `monthlyResult` | `string` | Résultat du mois formaté (ex: `"+ 7 362 413 FCFA"`) |
| `cumulativeResult` | `string` | Résultat cumulé YTD formaté (ex: `"+ 7 362 413 FCFA"`) |
| `isProfitable` | `boolean` | `true` si le mois est bénéficiaire |
| `hasData` | `boolean` | `false` si le mois n'a pas encore de données (mois futur) |

```typescript
interface IMonthData {
  month: string;
  monthName: string;
  courses: number;
  staff: number;
  ca: string;
  expenses: string;
  reimbursements: string;
  investments: string;
  progress: number;
  monthlyResult: string;
  cumulativeResult: string;
  isProfitable: boolean;
  hasData: boolean;
}
```

### 2.3 Exemple de réponse complète

```json
{
  "annee": 2026,
  "mois": [
    {
      "month": "janvier",
      "monthName": "Janvier 2026",
      "courses": 373,
      "staff": 12,
      "ca": "5 786 973 FCFA",
      "expenses": "4 166 682 FCFA",
      "reimbursements": "43 298 FCFA",
      "investments": "1 287 001 FCFA",
      "progress": 1,
      "monthlyResult": "+ 7 362 413 FCFA",
      "cumulativeResult": "+ 7 362 413 FCFA",
      "isProfitable": true,
      "hasData": true
    },
    {
      "month": "avril",
      "monthName": "Avril 2026",
      "courses": 0,
      "staff": 0,
      "ca": "",
      "expenses": "",
      "reimbursements": "",
      "investments": "",
      "progress": 4,
      "monthlyResult": "",
      "cumulativeResult": "",
      "isProfitable": false,
      "hasData": false
    }
  ]
}
```

> Les mois sans données (`hasData: false`) doivent quand même être inclus dans la réponse pour que l'affichage chronologique reste complet sur 12 mois.

---

## 3. Format alternatif (valeurs brutes)

Si le formatage FCFA est géré côté frontend, le backend peut renvoyer les valeurs numériques brutes :

```typescript
interface IMonthDataRaw {
  month: string;
  monthName: string;
  courses: number;
  staff: number;
  ca: number;
  expenses: number;
  reimbursements: number;
  investments: number;
  progress: number;
  monthlyResult: number;
  cumulativeResult: number;
  isProfitable: boolean;
  hasData: boolean;
}
```

```json
{
  "month": "janvier",
  "monthName": "Janvier 2026",
  "courses": 373,
  "staff": 12,
  "ca": 5786973,
  "expenses": 4166682,
  "reimbursements": 43298,
  "investments": 1287001,
  "progress": 1,
  "monthlyResult": 7362413,
  "cumulativeResult": 7362413,
  "isProfitable": true,
  "hasData": true
}
```

---

## 4. Référentiel des années disponibles

**Endpoint suggéré :** `GET /api/erp/analytics/bilan-annuel/annees`

**Réponse :**
```json
{
  "annees": [2024, 2025, 2026, 2027, 2028]
}
```
