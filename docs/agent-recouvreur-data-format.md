# Spécification API — Agent Recouvreur

Page : `/finance/comptabilite/agent-recouvreur`

L'agent recouvreur voit uniquement les factures qui lui sont assignées et dont le statut fait partie du périmètre agent : `Recouvrement`, `Déposé partenaire`, `Soldé`, `Preuve ajoutée`, `Visé DG`.

---

## Workflow statuts côté agent

```
[Recouvrement]
      ↓  PATCH /depot-partenaire
[Déposé partenaire]
      ↓  POST /encaissements  (type=Acompte → reste sur Déposé partenaire)
      ↓  POST /encaissements  (type=Solde  → passe à Soldé)
[Soldé]
      ↓  PATCH /verser-comptable
[Preuve ajoutée]   ← terminé côté agent
```

---

## Endpoints

---

### `GET /api/finance/agent-recouvreur/factures`

Liste paginée des factures assignées à l'agent authentifié, avec stats d'en-tête.

**Query params**

| Paramètre   | Type                                        | Défaut  | Description                                   |
|-------------|---------------------------------------------|---------|-----------------------------------------------|
| `periode`   | `'mois' \| 'annee' \| 'cycle' \| 'plage'`  | `'mois'`| Période de filtrage                           |
| `dateDebut` | `string` (ISO `YYYY-MM-DD`)                 | —       | Requis si `periode=plage`                     |
| `dateFin`   | `string` (ISO `YYYY-MM-DD`)                 | —       | Requis si `periode=plage`                     |
| `statut`    | `string`                                    | —       | Filtre par statut exact (voir valeurs ci-bas) |
| `page`      | `number`                                    | `0`     | Index de page (0-based)                       |
| `size`      | `number`                                    | `20`    | Taille de page                                |

> Le backend filtre automatiquement sur `agentId = utilisateur connecté`. L'agent ne voit jamais les factures d'un autre agent.

**`statut` valeurs acceptées**

```
'Recouvrement' | 'Déposé partenaire' | 'Soldé' | 'Preuve ajoutée' | 'Visé DG'
```

**Réponse `200`**

```json
{
  "stats": {
    "enAttente": 4,
    "avecAcompte": 2,
    "soldees": 3,
    "tauxRecouvrement": 62.5
  },
  "factures": {
    "content": [
      {
        "id": "a1",
        "numero": "TKT-2026-0212",
        "partenaire": "TURBO EXPRESS SARL",
        "montant": 480000,
        "montantRecouvre": null,
        "pourcentageRecouvre": null,
        "cycle": "Journalier",
        "emission": "2026-05-02",
        "depotPartenaire": null,
        "depotBanque": null,
        "agent": "KOUASSI MEDARD",
        "statut": "Recouvrement"
      },
      {
        "id": "a3",
        "numero": "FAC-2026-0143",
        "partenaire": "TURBO EXPRESS SARL",
        "montant": 845000,
        "montantRecouvre": 400000,
        "pourcentageRecouvre": 47,
        "cycle": "Hebdomadaire",
        "emission": "2026-04-15",
        "depotPartenaire": {
          "date": "2026-04-18",
          "agent": "KOUASSI MEDARD"
        },
        "depotBanque": null,
        "agent": "KOUASSI MEDARD",
        "statut": "Déposé partenaire"
      }
    ],
    "totalElements": 9,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

**Description des champs `stats`**

| Champ               | Description                                                             |
|---------------------|-------------------------------------------------------------------------|
| `enAttente`         | Nombre de factures avec `statut = 'Recouvrement'`                       |
| `avecAcompte`       | Nombre de factures avec `0 < pourcentageRecouvre < 100`                 |
| `soldees`           | Nombre de factures avec `statut = 'Soldé'`                              |
| `tauxRecouvrement`  | `(somme montantRecouvre / somme montant) × 100`, arrondi entier         |

---

### `PATCH /api/finance/agent-recouvreur/factures/:id/depot-partenaire`

L'agent dépose la facture chez le partenaire. Passe le statut de `Recouvrement` → `Déposé partenaire`.

**Body JSON**

```json
{
  "date": "2026-05-10",
  "montant": 480000,
  "agent": "KOUASSI MEDARD"
}
```

| Champ     | Type                        | Requis | Description                           |
|-----------|-----------------------------|--------|---------------------------------------|
| `date`    | `string` (ISO `YYYY-MM-DD`) | ✓      | Date du dépôt chez le partenaire      |
| `montant` | `number`                    | ✓      | Montant déposé (F CFA)                |
| `agent`   | `string`                    | ✓      | Nom de l'agent ayant effectué le dépôt|

**Réponse `200`** — facture mise à jour (même structure que dans le `content[]` ci-dessus)

**Erreurs**

| Code | Description                                             |
|------|---------------------------------------------------------|
| `400`| Statut incompatible (`statut ≠ 'Recouvrement'`)         |
| `404`| Facture introuvable ou non assignée à l'agent connecté  |

---

### `POST /api/finance/agent-recouvreur/factures/:id/encaissements`

Ajoute un paiement (acompte ou solde total) à une facture.

- Si `type = 'Acompte'` : met à jour `montantRecouvre` et `pourcentageRecouvre`, statut inchangé.
- Si `type = 'Solde'` : met à jour `montantRecouvre = montant total facture`, `pourcentageRecouvre = 100`, statut → `Soldé`.

**Body JSON**

```json
{
  "type": "Acompte",
  "date": "2026-05-12",
  "montant": 200000,
  "preuve": "https://storage.turbo.ci/preuves/recu-001.pdf",
  "remarque": "Chèque reçu sur place"
}
```

| Champ      | Type                              | Requis | Description                                   |
|------------|-----------------------------------|--------|-----------------------------------------------|
| `type`     | `'Acompte' \| 'Solde'`           | ✓      | Nature du paiement                            |
| `date`     | `string` (ISO `YYYY-MM-DD`)       | ✓      | Date d'encaissement                           |
| `montant`  | `number`                          | ✓      | Montant encaissé (F CFA)                      |
| `preuve`   | `string` (URL)                    | —      | URL de la pièce justificative (optionnel)      |
| `remarque` | `string`                          | —      | Note libre (optionnel)                         |

**Réponse `201`** — paiement enregistré + facture mise à jour

```json
{
  "paiement": {
    "id": "p-uuid",
    "type": "Acompte",
    "date": "2026-05-12",
    "montant": 200000,
    "preuve": "https://storage.turbo.ci/preuves/recu-001.pdf",
    "remarque": "Chèque reçu sur place"
  },
  "facture": {
    "id": "a3",
    "montantRecouvre": 600000,
    "pourcentageRecouvre": 71,
    "statut": "Déposé partenaire"
  }
}
```

**Erreurs**

| Code | Description                                                      |
|------|------------------------------------------------------------------|
| `400`| Montant négatif, ou montant dépasse le restant dû               |
| `400`| Statut incompatible (`statut ∉ {'Déposé partenaire'}`)           |
| `404`| Facture introuvable ou non assignée à l'agent connecté           |

---

### `PATCH /api/finance/agent-recouvreur/factures/:id/verser-comptable`

L'agent verse les fonds au comptable (dépôt banque). Passe le statut de `Soldé` → `Preuve ajoutée`.

**Body JSON**

```json
{
  "montant": 845000,
  "date": "2026-05-14"
}
```

| Champ     | Type                        | Requis | Description                              |
|-----------|-----------------------------|--------|------------------------------------------|
| `montant` | `number`                    | ✓      | Montant versé (F CFA)                    |
| `date`    | `string` (ISO `YYYY-MM-DD`) | ✓      | Date du versement / dépôt banque         |

**Réponse `200`** — facture mise à jour

```json
{
  "id": "a3",
  "statut": "Preuve ajoutée",
  "depotBanque": "2026-05-14",
  "montantRecouvre": 845000,
  "pourcentageRecouvre": 100
}
```

**Erreurs**

| Code | Description                                             |
|------|---------------------------------------------------------|
| `400`| Statut incompatible (`statut ≠ 'Soldé'`)                |
| `404`| Facture introuvable ou non assignée à l'agent connecté  |

---

## Schéma TypeScript complet — `IFactureAgent`

```typescript
export type StatutAgentFacture =
  | 'Recouvrement'
  | 'Déposé partenaire'
  | 'Soldé'
  | 'Preuve ajoutée'
  | 'Visé DG';

export interface IFactureAgent {
  id: string;
  numero: string;
  partenaire: string;
  montant: number;                          // Montant total de la facture (F CFA)
  montantRecouvre: number | null;           // null si aucun paiement reçu
  pourcentageRecouvre: number | null;       // null si aucun paiement reçu ; 0–100
  cycle: string;                            // ex: "Mensuel", "Hebdomadaire", "Journalier"
  emission: string;                         // Date d'émission ISO ou "—"
  depotPartenaire: {
    date: string;                           // Date ISO du dépôt
    agent: string;                          // Nom de l'agent
  } | null;
  depotBanque: string | null;               // Date ISO du dépôt banque, null sinon
  agent: string;                            // Nom de l'agent assigné, "—" si non assigné
  statut: StatutAgentFacture;
}

export interface IAgentRecouvreurStats {
  enAttente: number;
  avecAcompte: number;
  soldees: number;
  tauxRecouvrement: number;                 // 0–100
}

export interface IAgentRecouvreurListResponse {
  stats: IAgentRecouvreurStats;
  factures: {
    content: IFactureAgent[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;                         // page courante (0-based)
  };
}

export interface IPaiementEncaissement {
  id: string;
  type: 'Acompte' | 'Solde';
  date: string;
  montant: number;
  preuve?: string;
  remarque?: string;
}
```
