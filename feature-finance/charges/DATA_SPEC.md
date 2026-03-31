# Spécification des données — Module Charges

---

## 1. Charges Fixes

### 1.1 Tableau des charges fixes (`ChargesFixesTable`)

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique |
| `name` | `string` | Désignation de la charge |
| `description` | `string?` | Description optionnelle |
| `category` | `string` | Libellé de la catégorie |
| `categoryColor` | `string` | Classes CSS Tailwind pour la couleur du badge catégorie |
| `cycle` | `string` | Libellé du cycle (ex: `"Tous les mois"`) |
| `amount` | `string` | Montant formaté (ex: `"350 000 FCFA"`) |
| `tauxJournalier` | `string` | Taux journalier calculé (ex: `"11 667 FCFA/j"`) |
| `cumulMensuel` | `string` | Cumul mensuel calculé (ex: `"350 000 FCFA"`) |
| `dueDate` | `string` | Jour d'échéance (ex: `"01"`, `"15"`) |
| `status` | `string` | Libellé du statut (ex: `"Actif"`) |
| `statusColor` | `string` | Classes CSS Tailwind pour la couleur du statut |
| `isAutomatic` | `boolean?` | `true` si générée automatiquement par le système |

```typescript
interface ChargeFixe {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryColor: string;
  cycle: string;
  amount: string;
  tauxJournalier: string;
  cumulMensuel: string;
  dueDate: string;
  status: string;
  statusColor: string;
  isAutomatic?: boolean;
}
```

---

### 1.2 Création d'une charge fixe

**Endpoint suggéré :** `POST /api/erp/charges-fixes`

**Corps de la requête :**

| Champ | Type | Requis | Valeurs possibles |
|---|---|---|---|
| `name` | `string` | ✅ | Texte libre (ex: `"Loyer Bureau Principal"`) |
| `category` | `string` | ✅ | `loyer` \| `administratif` \| `logistique` \| `maintenance` \| `communication` \| `assurance` \| `autre` |
| `cycle` | `string` | ✅ | `mensuel` \| `trimestriel` \| `semestriel` \| `annuel` |
| `amount` | `number` | ✅ | Montant en FCFA (ex: `350000`) |
| `dueDate` | `string` | ✅ | Jour du mois `"01"` → `"31"` |
| `description` | `string` | ❌ | Texte libre |

```json
{
  "name": "Loyer Bureau Principal",
  "category": "loyer",
  "cycle": "mensuel",
  "amount": 350000,
  "dueDate": "01",
  "description": "Loyer mensuel du bureau principal"
}
```

**Réponse attendue :** L'objet `ChargeFixe` complet avec `id`, `status: "Actif"`, `isAutomatic: false`, `tauxJournalier`, `cumulMensuel` et les champs de couleur calculés côté serveur.

---

### 1.3 Modification d'une charge fixe

**Endpoint suggéré :** `PATCH /api/erp/charges-fixes/:id`

**Corps de la requête :** Mêmes champs que la création, tous optionnels.

```json
{
  "name": "Loyer Bureau Principal (nouveau)",
  "amount": 400000,
  "dueDate": "05"
}
```

---

### 1.4 Suppression d'une charge fixe

**Endpoint suggéré :** `DELETE /api/erp/charges-fixes/:id`

**Corps :** Aucun. L'`id` est passé dans l'URL.

> ⚠️ Les charges avec `isAutomatic: true` ne sont pas supprimables depuis l'interface.

---

### 1.5 Activation / Désactivation d'une charge fixe

**Endpoint suggéré :** `PATCH /api/erp/charges-fixes/:id/toggle`

```json
{
  "enabled": false
}
```

---

## 2. Dépenses Variables

### 2.1 Tableau des dépenses variables (`DepensesVariablesTable`)

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique |
| `date` | `string` | Date de la dépense (ex: `"2026-03-15"`) |
| `designation` | `string` | Intitulé de la dépense |
| `amount` | `string` | Montant formaté (ex: `"25 000 FCFA"`) |
| `justificatif` | `string` | Justificatif ou `"—"` si absent |
| `enabled` | `boolean` | Statut actif/inactif |

```typescript
interface DepenseVariable {
  id: string;
  date: string;
  designation: string;
  amount: string;
  justificatif: string;
  enabled: boolean;
}
```

---

### 2.2 Création d'une dépense variable

**Endpoint suggéré :** `POST /api/erp/depenses-variables`

**Corps de la requête :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `designation` | `string` | ✅ | Intitulé (ex: `"Achat carburant"`) |
| `montant` | `number` | ✅ | Montant en FCFA (ex: `25000`) |
| `date` | `string` | ✅ | Format ISO `YYYY-MM-DD` (ex: `"2026-03-15"`) |
| `justificatif` | `string` | ❌ | Description ou référence de justificatif |

```json
{
  "designation": "Achat carburant livraisons",
  "montant": 25000,
  "date": "2026-03-15",
  "justificatif": "Reçu pompe #4821"
}
```

**Réponse attendue :** L'objet `DepenseVariable` complet avec `id`, `amount` formaté, et `enabled: true`.

---

### 2.3 Modification d'une dépense variable

**Endpoint suggéré :** `PATCH /api/erp/depenses-variables/:id`

**Corps de la requête :** Mêmes champs que la création, tous optionnels.

```json
{
  "montant": 30000,
  "justificatif": "Reçu pompe #4822 (correction)"
}
```

---

### 2.4 Suppression d'une dépense variable

**Endpoint suggéré :** `DELETE /api/erp/depenses-variables/:id`

**Corps :** Aucun. L'`id` est passé dans l'URL.

---

### 2.5 Activation / Désactivation d'une dépense variable

**Endpoint suggéré :** `PATCH /api/erp/depenses-variables/:id/toggle`

```json
{
  "enabled": false
}
```

---

## 3. Référentiels

### Catégories de charges fixes

| Valeur (`value`) | Libellé (`label`) |
|---|---|
| `loyer` | Loyer |
| `administratif` | Administratif |
| `logistique` | Logistique |
| `maintenance` | Maintenance |
| `communication` | Communication |
| `assurance` | Assurance |
| `autre` | Autre |

### Cycles de paiement

| Valeur (`value`) | Libellé (`label`) |
|---|---|
| `mensuel` | Tous les mois |
| `trimestriel` | Tous les trimestres |
| `semestriel` | Tous les semestres |
| `annuel` | Tous les ans |
