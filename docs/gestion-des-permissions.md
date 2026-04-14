# Gestion des permissions dans Turbo Delivery ERP

**Document à destination de la direction**
Objectif : comprendre comment fonctionne l'accès à l'application selon les rôles, et pouvoir décider qui a le droit de faire quoi.

---

## 1. Le principe en une phrase

> Chaque utilisateur a **un rôle**. À chaque rôle, nous associons une **liste de choses qu'il peut faire** (voir, créer, modifier, valider, décaisser, etc.). L'application adapte automatiquement ce que l'utilisateur voit et ce qu'il peut cliquer.

Concrètement : si un comptable n'a pas le droit de valider une dépense, le bouton "Valider" **n'apparaît même pas** sur son écran. Il ne peut donc pas se tromper, ni tenter une action interdite.

---

## 2. Les rôles en place

Nous avons aujourd'hui **6 rôles** dans le système :

| Rôle | Métier | Profil type |
|---|---|---|
| **DG** | Directeur Général | Décisionnaire final, voit et pilote tout |
| **DGA** | Directeur Général Adjoint | Valide en premier niveau, supervise |
| **COMPTABLE** | Comptabilité / Finance | Saisit les dépenses, décaisse, suit les paiements |
| **OPS_MANAGER** | Responsable opérations | Pilote les livraisons, livreurs, tickets |
| **BUSINESS_DEVELOPER** | Développement commercial | Gère les partenaires restaurants |
| **STANDARD** | Agent standard | Saisit les tickets, opérations du quotidien |

---

## 3. Le vocabulaire des permissions

Pour décrire ce qu'un rôle peut faire, nous utilisons deux notions simples :

### Les actions (ce qu'on fait)
- **Voir** (lire) — consulter une information
- **Créer** — ajouter une nouvelle fiche
- **Modifier** — changer une fiche existante
- **Supprimer** — retirer une fiche
- **Viser (DGA)** — première validation d'une dépense
- **Approuver (DG)** — validation finale d'une dépense
- **Rejeter** — refuser une dépense
- **Décaisser** — débloquer le paiement effectif
- **Accéder** — ouvrir une rubrique du menu

### Les ressources (sur quoi on agit)
Charges fixes, charges variables, dépenses, paiements, tickets, livreurs, restaurants, commandes, finance, personnel, utilisateurs, trafic, paramètres, notifications, analytics.

**Formule** : permission = **Action** + **Ressource**
→ Exemple : *"Décaisser" + "Charge fixe"* = le comptable peut cliquer sur "Décaisser" depuis la page charges fixes.

---

## 4. Matrice actuelle des permissions

| Action / Ressource | DG | DGA | COMPTABLE | OPS_MANAGER | BUSINESS_DEV | STANDARD |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Finance** | | | | | | |
| Voir les dépenses / charges | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Créer / modifier une dépense | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Viser une dépense (1er niveau) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approuver une dépense (final) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rejeter une dépense | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Décaisser | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Voir gestion des paiements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Opérations** | | | | | | |
| Voir / gérer les tickets | ✅ | ✅ | ✅ | ✅ | ✅ (voir) | ✅ |
| Voir le trafic / livraisons | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Voir les commandes | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Partenaires** | | | | | | |
| Voir les restaurants | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider un nouveau restaurant | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Livreurs** | | | | | | |
| Voir la liste livreurs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gérer créneaux / performance | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Administration** | | | | | | |
| Voir le personnel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir les utilisateurs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Paramètres / Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

✅ = autorisé  ❌ = non autorisé

---

## 5. Le circuit de validation d'une dépense

Pour bien comprendre comment les rôles s'articulent, voici le parcours d'une dépense :

```
[COMPTABLE saisit] → [DGA vise] → [DG approuve] → [COMPTABLE décaisse]
                          ↓              ↓
                      Peut rejeter   Peut rejeter
```

1. Le **comptable** saisit la dépense (facture, montant, justificatif).
2. Le **DGA** la vise (contrôle de premier niveau).
3. Le **DG** l'approuve (validation finale).
4. Le **comptable** procède au décaissement effectif.

À chaque étape, le DGA ou le DG peuvent rejeter la dépense avec un commentaire.

---

## 6. Comment demander une modification des droits

Pour ajuster les permissions, il suffit d'indiquer **trois choses** :

1. **Le rôle concerné** — DG, DGA, COMPTABLE, OPS_MANAGER, BUSINESS_DEVELOPER, STANDARD
2. **L'action** — voir, créer, modifier, supprimer, viser, approuver, rejeter, décaisser, accéder
3. **La ressource** — ex. charges fixes, tickets, restaurants, etc.

### Exemples de demandes bien formulées

> « Le **BUSINESS_DEVELOPER** doit pouvoir **modifier** les **livreurs**. »

> « Le **COMPTABLE** ne doit plus pouvoir **supprimer** une **charge fixe**. »

> « Ajoutons un nouveau rôle **AUDITEUR** qui peut **voir** toutes les **finances** mais ne peut rien modifier. »

### Ce qu'il faut éviter

- « Donnez plus de droits au comptable » *(trop vague : lesquels ?)*
- « Le DG doit tout voir » *(c'est déjà le cas)*
- « Bloquer l'accès à la page X » *(préciser pour quel rôle)*

---

## 7. Les garanties techniques

- **Aucun risque de fausse manipulation** : un bouton ou une page interdits sont invisibles, donc non cliquables.
- **Un seul endroit à modifier** : les règles sont centralisées dans un unique fichier. Un changement prend quelques minutes.
- **Évolutif** : ajouter un rôle, une action ou une ressource ne nécessite pas de refonte.
- **Standard du marché** : nous utilisons la bibliothèque CASL, référence open-source pour ce type de système (utilisée par de nombreuses applications métier).

---

## 8. Prochaines étapes possibles

Si la direction le juge utile, nous pouvons :

1. **Ajouter des rôles supplémentaires** (ex. Auditeur, Responsable régional, Stagiaire)
2. **Affiner par montant** — ex. un DGA approuve seul les dépenses < 500 000 FCFA, au-delà le DG est obligatoire
3. **Journaliser les actions sensibles** — qui a validé, décaissé, rejeté et quand (traçabilité)
4. **Renforcer côté serveur** — aujourd'hui les protections sont principalement côté interface ; nous pouvons ajouter une seconde barrière côté serveur pour plus de sécurité

---

**Pour toute remarque ou ajustement**, merci de formuler la demande sous la forme :
> *Rôle* → *Action* → *Ressource* → *Autoriser / Interdire*
