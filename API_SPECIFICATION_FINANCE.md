# Spécification API - Module Finance

## 1. Charges Fixes & Dépenses Variables

### GET /api/finance/charges
```json
{
  "charges_fixes": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "categoryColor": "string",
      "cycle": "mensuel|trimestriel|semestriel|annuel",
      "amount": "number",
      "dueDate": "string",
      "status": "Actif|Inactif",
      "isAutomatic": "boolean",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "depenses_variables": [
    {
      "id": "string",
      "date": "string",
      "designation": "string",
      "amount": "number",
      "justificatif": "string",
      "enabled": "boolean",
      "createdAt": "datetime"
    }
  ]
}
```

### POST /api/finance/charges/fixes
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "cycle": "mensuel|trimestriel|semestriel|annuel",
  "amount": "number",
  "dueDate": "string"
}
```

### POST /api/finance/charges/variables
```json
{
  "designation": "string",
  "montant": "number",
  "date": "string",
  "justificatif": "string"
}
```

## 2. Analyse de Rentabilité

### GET /api/finance/analyse-rentabilite?startDate=2026-03-01&endDate=2026-03-31
```json
{
  "periode": {
    "debut": "datetime",
    "fin": "datetime"
  },
  "chiffre_affaires": "number",
  "total_depenses": "number",
  "marge_actuelle": "number",
  "taux_marge": "number",
  "evolution": [
    {
      "date": "string",
      "ca": "number",
      "depenses": "number"
    }
  ],
  "depenses_detail": [
    {
      "designation": "string",
      "amount": "number",
      "type": "fixe|variable"
    }
  ],
  "charges_fixes": "number",
  "depenses_variables": "number"
}
```

## 3. Rapports Financiers

### GET /api/finance/rapports-financiers?startDate=2026-03-01&endDate=2026-03-31
```json
{
  "periode": {
    "debut": "datetime",
    "fin": "datetime"
  },
  "metriques": [
    {
      "label": "string",
      "value": "string",
      "highlight": "success|warning|null"
    }
  ],
  "kpis": [
    {
      "label": "string",
      "value": "string",
      "unit": "string"
    }
  ],
  "charges_fixes_repartition": [
    {
      "label": "string",
      "percentage": "number",
      "amount": "number"
    }
  ],
  "depenses_variables": [
    {
      "date": "string",
      "designation": "string",
      "amount": "string"
    }
  ]
}
```

### GET /api/finance/rapports-financiers/export?format=csv&startDate=2026-03-01&endDate=2026-03-31
- Returns CSV file

## 4. Gestion des Paiements

### GET /api/finance/paiements?month=2026-03
```json
{
  "periode": "string",
  "stats": {
    "pending": {
      "amount": "number",
      "count": "number"
    },
    "paid": {
      "amount": "number", 
      "count": "number"
    },
    "total": {
      "amount": "number",
      "count": "number"
    }
  },
  "pending_payments": [
    {
      "id": "string",
      "designation": "string",
      "month": "string",
      "amount": "number",
      "status": "pending",
      "dueDate": "datetime"
    }
  ],
  "paid_payments": [
    {
      "id": "string",
      "designation": "string",
      "month": "string", 
      "amount": "number",
      "status": "paid",
      "paymentDate": "datetime"
    }
  ]
}
```

### POST /api/finance/paiements/{id}/mark-paid
```json
{
  "paymentDate": "datetime",
  "paymentMethod": "string",
  "notes": "string"
}
```

## 5. Filtres communs

Tous les endpoints acceptent:
- `startDate`: Date de début (YYYY-MM-DD)
- `endDate`: Date de fin (YYYY-MM-DD) 
- `month`: Mois (YYYY-MM)
- `category`: Filtre par catégorie
- `status`: Filtre par statut

## 6. Réponses d'erreur

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

## 7. Pagination

Pour les listes, utiliser:
- `page`: numéro de page (défaut: 1)
- `limit`: nombre d'éléments par page (défaut: 20)
- `search`: terme de recherche
