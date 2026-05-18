# Spécification API — Responsable Financier

## Endpoints

---

### GET `/api/finance/responsable-financier/factures`

Liste paginée des factures avec stats d'en-tête.

**Query params**

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `periode` | `'mois' \| 'annee' \| 'cycle' \| 'plage'` | `'mois'` | Période de filtrage |
| `dateDebut` | `string` (ISO) | — | Requis si `periode=plage` |
| `dateFin` | `string` (ISO) | — | Requis si `periode=plage` |
| `statut` | `string` | `'Tous'` | `'Tous'`, `'En attente'`, `'Acompte'`, `'Soldé'`, ou toute valeur de `StatutFacture` |
| `page` | `number` | `0` | Index de page (0-based) |
| `size` | `number` | `20` | Taille de page |

> `statut=En attente` est un alias côté serveur pour `statut IN ('Recouvrement', 'À valider', 'Déposé partenaire')`.

**Réponse `200`**

```json
{
  "stats": {
    "totalFactures": 12,
    "totalMontant": 48500000,
    "nombrePartenaires": 3,
    "tauxRecouvrement": 78.5
  },
  "factures": {
    "content": [
      {
        "id": "string",
        "numero": "FAC-2026-0212",
        "partenaire": "SOCIBE SARL",
        "montant": 4500000,
        "montantRecouvre": 4500000,
        "pourcentageRecouvre": 100,
        "cycle": "Mensuel",
        "emission": "2026-05-02",
        "depotPartenaire": {
          "date": "2026-05-03",
          "agent": "M. KOUAME"
        },
        "depotBanque": "2026-05-06",
        "agent": "K. Medard",
        "statut": "Soldé"
      }
    ],
    "totalElements": 12,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

**`statut` valeurs possibles**

```
'Soldé' | 'Acompte' | 'Déposé partenaire' | 'Recouvrement'
| 'En cours' | 'Validé' | 'Preuve ajoutée' | 'Visé DG' | 'À valider'
```

---

### GET `/api/finance/responsable-financier/factures/:id`

Détail d'une facture avec historique des statuts.

**Réponse `200`**

```json
{
  "id": "string",
  "numero": "FAC-2026-0212",
  "partenaire": "SOCIBE SARL",
  "montant": 4500000,
  "montantRecouvre": 4500000,
  "pourcentageRecouvre": 100,
  "cycle": "Mensuel",
  "emission": "2026-05-02",
  "depotPartenaire": {
    "date": "2026-05-03",
    "agent": "M. KOUAME"
  },
  "depotBanque": "2026-05-06",
  "agent": "K. Medard",
  "statut": "Soldé",
  "historique": [
    {
      "label": "Facture émise",
      "date": "2026-05-02",
      "agent": "K. Medard",
      "montant": null,
      "isCurrent": false,
      "isPending": false
    },
    {
      "label": "En attente de validation",
      "date": null,
      "agent": null,
      "montant": null,
      "isCurrent": false,
      "isPending": true
    }
  ]
}
```

**Réponse `404`**

```json
{ "message": "Facture introuvable" }
```

---

### PATCH `/api/finance/responsable-financier/factures/:id/valider`

Valide une facture (passage au statut `Validé`).

**Body**

```json
{
  "cycle": "Journalier | Hebdomadaire | Mensuel"
}
```

**Réponse `200`**

```json
{
  "id": "string",
  "statut": "Validé"
}
```

---

### PATCH `/api/finance/responsable-financier/factures/:id/recouvrement`

Lance le recouvrement d'une facture et assigne un agent.

**Body**

```json
{
  "agentId": "string"
}
```

**Réponse `200`**

```json
{
  "id": "string",
  "statut": "Recouvrement",
  "agent": "string"
}
```

---

### GET `/api/finance/responsable-financier/agents`

Liste des agents disponibles pour le recouvrement.

**Réponse `200`**

```json
[
  {
    "id": "string",
    "nom": "KOUASSI MEDARD",
    "role": "Agent de recouvrement"
  }
]
```
