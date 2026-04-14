> 🎯 **Objectif** : Comprendre simplement qui peut faire quoi dans l’application, afin de piloter les accès et sécuriser les opérations.
>

---

## 🧭 1. Principe général

> Chaque utilisateur possède un **rôle**.
>
>
> Chaque rôle définit **ce qu’il peut voir et faire** dans l’application.
>

✅ Résultat :

- Les actions non autorisées sont **invisibles**
- Aucun risque d’erreur ou de mauvaise manipulation
- L’interface s’adapte automatiquement à chaque profil

---

## 👥 2. Rôles existants

| Rôle | Fonction | Description |
| --- | --- | --- |
| **DG** | Direction Générale | Accès complet, décisionnaire final |
| **DGA** | Direction Générale Adjointe | Supervision + validation niveau 1 |
| **COMPTABLE** | Finance | Gestion des dépenses et paiements |
| **OPS_MANAGER** | Opérations | Pilotage des livraisons et tickets |
| **BUSINESS_DEVELOPER** | Commercial | Gestion des restaurants partenaires |
| **STANDARD** | Agent | Saisie des opérations quotidiennes |

---

## 🔐 3. Comment fonctionnent les permissions

### 🧩 3.1 Les actions (ce que l’on peut faire)

- Voir (consulter)
- Créer
- Modifier
- Supprimer
- Viser (validation DGA)
- Approuver (validation DG)
- Rejeter
- Décaisser
- Accéder (menu / page)

---

### 📦 3.2 Les ressources (sur quoi on agit)

- Finances : charges, dépenses, paiements
- Opérations : tickets, commandes, trafic
- Ressources : livreurs, personnel, utilisateurs
- Business : restaurants partenaires
- Système : paramètres, notifications, analytics

---

### ⚙️ Règle simple

> **Permission = Action + Ressource**
>

📌 Exemple :

👉 *Décaisser + Dépense* = autoriser le paiement

---

## 📋 4. Matrice des permissions

| Action / Ressource | DG | DGA | COMPTABLE | OPS_MANAGER | BUSINESS_DEV | STANDARD |
| --- | --- | --- | --- | --- | --- | --- |
| **FINANCE** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Voir dépenses | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Créer / modifier | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Viser (niveau 1) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approuver (final) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rejeter | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Décaisser | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Voir paiements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **OPÉRATIONS** |  |  |  |  |  |  |
| Gérer tickets | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅ |
| Voir trafic | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Voir commandes | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **PARTENAIRES** |  |  |  |  |  |  |
| Voir restaurants | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider restaurant | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **LIVREURS** |  |  |  |  |  |  |
| Voir liste | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Créneaux | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Gérer performance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **ADMINISTRATION** |  |  |  |  |  |  |
| Voir personnel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir utilisateurs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Paramètres | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔄 5. Circuit de validation d’une dépense

### 🧾 Processus

1. **COMPTABLE** saisit la dépense
2. **DGA** effectue une validation (niveau 1)
3. **DG** approuve (validation finale)
4. **COMPTABLE** effectue le décaissement

⚠️ À chaque étape :

👉 Le **DGA** ou le **DG** peut rejeter la dépense avec commentaire

---

## 📝 6. Demande de modification des droits

### 🧩 Format obligatoire

> **Rôle → Action → Ressource → Autoriser / Interdire**
>

---

### ✅ Exemples corrects

- BUSINESS_DEVELOPER → Modifier → Livreurs → Autoriser
- COMPTABLE → Supprimer → Charge fixe → Interdire
- AUDITEUR → Voir → Finances → Autoriser

---

### ❌ À éviter

- “Donner plus de droits” (trop vague)
- “Bloquer une page” (pour quel rôle ?)
- “Le DG doit tout voir” (déjà le cas)

---

## 🛡️ 7. Garanties du système

- 🔒 Actions interdites **invisibles**
- ⚡ Modifications rapides (centralisées)
- 📈 Système évolutif
- 🧱 Basé sur un standard reconnu (CASL)

---

## 🚀 8. Évolutions possibles

1. Ajouter des rôles (Auditeur, Régional, Stagiaire)
2. Gérer des seuils de validation (ex : montant)
3. Journaliser les actions (traçabilité complète)
4. Renforcer la sécurité côté serveur

---

## 📌 Conclusion

> Le système actuel permet un **contrôle fin, sécurisé et évolutif** des accès.
>
>
> Il garantit que chaque utilisateur agit **strictement dans son périmètre**.
>

---

## 📩 Demande officielle

Pour toute modification :

> **Rôle → Action → Ressource → Autoriser / Interdire**
>