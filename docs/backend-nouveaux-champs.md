# Nouveaux champs à intégrer côté backend

> **Date :** 28 mai 2026  
> Document généré suite aux évolutions de l'interface ERP (création de profils Turboy et Partner).

---

## 1. Turboy (Livreur) — Création

**Endpoint :** `POST /api/erp/livreur`  
**Type de contenu :** `multipart/form-data`

### Nouveaux champs

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `personneAContacter` | `string` | Non | Numéro de téléphone de la personne à contacter en cas d'urgence |
| `permisConduire` | `"true"` \| `"false"` | Non | Indique si le livreur possède un permis de conduire (`"true"` = oui, `"false"` = non) |
| `ficheIdentification` | `File` (PDF / image) | Non | Fiche d'identification Turboy (document scanné) |

### Champs déjà envoyés (pour rappel)

| Champ | Type |
|---|---|
| `nom` | `string` |
| `prenoms` | `string` |
| `birthDay` | `string` (date) |
| `habitation` | `string` |
| `telephone` | `string` |
| `email` | `string` |
| `typeDocument` | `string` (`CNI`, `PASSEPORT`, `PERMIS`) |
| `numeroCni` | `string` |
| `typeVehicule` | `string` (`MOTO`, `VELO`, `VOITURE`, `TRICYCLE`) |
| `nomVehicule` | `string` |
| `immatriculation` | `string` |
| `telephoneCompte` | `string` |
| `password` | `string` |
| `avatar` | `File` |
| `cni_0`, `cni_1` | `File` |
| `vehiclePhoto` | `File` |
| `contrat` | `File` |

---

## 2. Restaurant (Partner) — Création

**Endpoint :** `POST /api/V1/turbo/restaurant/v2/create`  
**Service :** `NEXT_PUBLIC_API_RESTO_URL`  
**Type de contenu :** `multipart/form-data`

### Nouveaux champs

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `ficheRenseignement` | `File` (PDF / image) | Non | Fiche de renseignement partner (document scanné) |
| `contratPartenariat` | `File` (PDF / image) | Non | Contrat de partenariat signé |
| `avenantContrat` | `File` (PDF / image) | Non | Avenant au contrat |
| `username` | `string` | Non | Identifiant de connexion du compte partenaire |
| `password` | `string` | Non | Mot de passe du compte partenaire |

### Champs déjà envoyés (pour rappel)

| Champ | Type |
|---|---|
| `nomEtablissement` | `string` |
| `description` | `string` |
| `email` | `string` |
| `telephone` | `string` |
| `codePostal` | `string` |
| `commune` | `string` |
| `localisation` | `string` |
| `latitude` | `number` |
| `longitude` | `number` |
| `siteWeb` | `string` |
| `typeCommission` | `string` (`FIXE`, `POURCENTAGE`) |
| `commission` | `number` |
| `methodRecouvrement` | `string` (`QUOTIDIEN`, `HEBDOMADAIRE`, `QUINZAINE`, `MENSUEL`) |
| `logo` | `File` |
| `coverImage` | `File` |
| `pictures` | `File[]` |
| `document` | `File` |
| `documentType` | `string` |
| `contact_nom_0`, `contact_telephone_0`, … | `string` |
| `openingHours[i][dayOfWeek]`, `openingHours[i][openingTime]`, `openingHours[i][closingTime]`, `openingHours[i][closed]` | `string` |

---

## 3. Restaurant (Partner) — Mise à jour

**Endpoint :** `PUT /api/V1/turbo/restaurant/v2/update?restoId={id}`  
**Service :** `NEXT_PUBLIC_API_RESTO_URL`  
**Type de contenu :** `multipart/form-data`

### Nouveaux champs

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `username` | `string` | Non | Nouvel identifiant de connexion du compte partenaire |
| `password` | `string` | Non | Nouveau mot de passe du compte partenaire |

> Ces deux champs sont présents sur la **fiche du restaurant** (page de modification) et sur la page **edit**. Ils ne sont envoyés que s'ils sont renseignés (champs non vides).

---

## 4. Statut ACTIF / INACTIF — Endpoints existants

Ces endpoints existent déjà dans le backend. **Aucune modification nécessaire.**

| Action | Endpoint |
|---|---|
| Activer | `PUT /api/V1/turbo/restaurant/{id}/activate` |
| Désactiver | `PUT /api/V1/turbo/restaurant/{id}/deactivate` |

> **Règle métier à vérifier côté backend :** lorsque `status = 0` (INACTIF), le restaurant ne doit **pas être comptabilisé dans le chiffre d'affaires**. Tous les nouveaux partenaires doivent être créés avec `status = 1` (ACTIF) par défaut.
