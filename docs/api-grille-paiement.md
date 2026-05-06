# API — Grille de paiement

## Endpoint

```
GET /creneaux/:id/grille-paiement
```

---

## Réponse complète

```json
{
  "id": "creneau-s16-2026",
  "code": "CRÉNEAU-S16-2026",
  "debut": "2026-04-13T00:00:00.000Z",
  "fin": "2026-04-19T23:59:59.000Z",
  "visePar": "Kader Samassé",
  "viseAt": "2026-04-22T09:00:00.000Z",
  "stats": {
    "totalLivreurs": 8,
    "totalBrut": 2847500,
    "totalNet": 2604300,
    "waveManquants": 1
  },
  "lignes": [ /* voir structure ci-dessous */ ]
}
```

---

## Structure d'une ligne `lignes[]`

```json
{
  "id": "l-007",

  "turboy": {
    "id": "trb-007",
    "nom": "Demba Kane",
    "code": "TRB-007"
  },

  "tickets": 30,
  "brut": 67200,
  "taux": 68,
  "bonus": true,
  "tauxManuel": false,
  "deductions": 0,
  "netAPayer": 45696,

  "numeroWave": "+221 77 145 67 88",
  "statut": "OK",

  "ticketDetails": [
    {
      "ref": "TKT-2026-00701",
      "partenaire": "Yassine Fast Food",
      "date": "2026-04-13",
      "commission": 1800
    }
  ],

  "bonusEligibilite": {
    "eligible": true,
    "tauxFinal": 68,
    "tauxFinalLabel": "Bonus éligible — taux 68% appliqué",
    "tauxFinalDetail": "Les critères présence et seuil sont tous remplis.",
    "criteres": [
      { "label": "Présence 6j/7", "detail": "7 jours travaillés", "valide": true },
      { "label": "Seuil 60 000 FCFA brut", "detail": "67 200 FCFA atteints", "valide": true }
    ]
  }
}
```

---

## Description des champs

### Racine

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique du créneau |
| `code` | `string` | Code lisible affiché dans la bannière (ex: `CRÉNEAU-S16-2026`) |
| `debut` | `string` (ISO 8601) | Date de début du créneau |
| `fin` | `string` (ISO 8601) | Date de fin du créneau |
| `visePar` | `string` | Nom de l'agent ayant posé le visa V2 |
| `viseAt` | `string` (ISO 8601) | Date et heure du visa V2 |
| `stats.totalLivreurs` | `number` | Nombre total de livreurs dans la grille |
| `stats.totalBrut` | `number` | Somme de tous les montants bruts (FCFA) |
| `stats.totalNet` | `number` | Somme de tous les nets à payer (FCFA) |
| `stats.waveManquants` | `number` | Nombre de lignes sans numéro Wave renseigné |

### Ligne (`lignes[]`)

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Identifiant unique de la ligne |
| `turboy.id` | `string` | ID du livreur |
| `turboy.nom` | `string` | Nom affiché dans la colonne **Turboy** |
| `turboy.code` | `string` | Code court sous le nom (ex: `TRB-007`) |
| `tickets` | `number` | Nombre de tickets livrés sur le créneau |
| `brut` | `number` | Montant brut en FCFA avant application du taux |
| `taux` | `number` | Taux de commission appliqué en % |
| `bonus` | `boolean` | `true` → badge amber **BONUS** affiché dans la colonne Taux |
| `tauxManuel` | `boolean` | `true` → badge orange **C** affiché (taux personnalisé, pas calculé) |
| `deductions` | `number` | Pénalités en FCFA — **valeur négative** (ex: `-9880`). `0` si aucune |
| `netAPayer` | `number` | Montant final en FCFA = `brut × taux / 100 + deductions` |
| `numeroWave` | `string \| null` | Numéro Wave du livreur. `null` ou `""` déclenche le statut `WAVE_MANQUANT` |
| `statut` | `"OK" \| "WAVE_MANQUANT"` | Calculable depuis `numeroWave`, peut être retourné directement par le backend |

### Détail tickets (`ticketDetails[]`)

| Champ | Type | Description |
|---|---|---|
| `ref` | `string` | Référence unique du ticket (affiché dans le modal détail) |
| `partenaire` | `string` | Nom du restaurant / partenaire concerné |
| `date` | `string` (`YYYY-MM-DD`) | Date de livraison |
| `commission` | `number` | Commission en FCFA pour ce ticket |

### Éligibilité bonus (`bonusEligibilite`)

| Champ | Type | Description |
|---|---|---|
| `eligible` | `boolean` | Le livreur est éligible au taux bonus |
| `tauxFinal` | `number` | Taux réellement appliqué (doit correspondre au champ `taux`) |
| `tauxFinalLabel` | `string` | Résumé court affiché dans le modal (ex: `"Bonus éligible — taux 68% appliqué"`) |
| `tauxFinalDetail` | `string` | Explication complète affichée sous le label |
| `criteres[].label` | `string` | Nom du critère (ex: `"Présence 6j/7"`) |
| `criteres[].detail` | `string` | Valeur constatée (ex: `"7 jours travaillés"`) |
| `criteres[].valide` | `boolean` | `true` → ✓ vert dans le modal, `false` → ✗ rouge |

---

## Règles métier (calculs backend)

```
netAPayer       = floor(brut × taux / 100) + deductions
statut          = (numeroWave && numeroWave.trim() !== '') ? 'OK' : 'WAVE_MANQUANT'
bonus           = bonusEligibilite.criteres.every(c => c.valide === true)
waveManquants   = lignes.filter(l => l.statut === 'WAVE_MANQUANT').length
totalBrut       = sum(lignes[].brut)
totalNet        = sum(lignes[].netAPayer)
```

---

## Cards statistiques (bandeau)

Les 4 cards affichées en haut de page sont alimentées par le sous-objet `stats` de la réponse.

| Card | Champ source | Formatage affiché | Visuel |
|---|---|---|---|
| **Livreurs** | `stats.totalLivreurs` | Entier brut (ex: `8`) | Icône Users |
| **Total Brut** | `stats.totalBrut` | Abrégé : `2.85M FCFA` ou `850K FCFA` | Icône Wallet |
| **Total Net** | `stats.totalNet` | Abrégé : `2.60M FCFA` — bordure verte | Icône TrendingUp |
| **Wave Manquants** | `stats.waveManquants` | Entier brut (ex: `1`) — bordure rouge | Icône Phone |

### Règle de formatage des montants

```
>= 1 000 000  →  "(n / 1 000 000).toFixed(2)M"   ex: 2 847 500 → "2.85M"
>= 1 000      →  "(n / 1 000).toFixed(0)K"        ex: 850 000  → "850K"
< 1 000       →  toLocaleString('fr-FR')           ex: 720      → "720"
```

### Comportement visuel

- **Total Net** : anneau vert (`ring-1 ring-green-400`) — met en valeur le montant à décaisser
- **Wave Manquants** : anneau rouge (`ring ring-red-600`) — alerte visuelle si `> 0`
- Si `waveManquants === 0` : le bouton **Soumettre au DGA** est débloqué (+ toutes les lignes cochées)
- Si `waveManquants > 0` : bannière rouge en tête de tableau + bouton désactivé

---

## Soumission au DGA

```
POST /creneaux/:id/grille-paiement/soumettre

Body: { "commentaire": "string (optionnel)" }

Response: 200 OK
```

La soumission est bloquée côté frontend si `stats.waveManquants > 0`.
