// Groupes de partenaires — administration côté ERP (demande owner 2026-08-04).
//
// « Prévoir pour l'ERP pour grouper les restaurants, de définir le compte admin
// principal, et les autres comptes liés aux restaurants groupés seront des comptes
// admins invités sur la gestion de ses restaurants, comme ça on ne perd rien. »
//
// Le modèle métier vit dans main-backend (V118, paquet `com.lunionlab.turbo.partenaire`) :
//   · `groupe_partenaire`  — un nom + un compte propriétaire (`proprietaire_user_id`).
//   · `groupe_restaurant`  — l'appartenance ; `restaurant_id` est UNIQUE en base,
//                            donc un établissement appartient à AU PLUS un groupe.
//   · `membre_acces`       — la source de vérité de l'autorisation : un accès porte
//                            SOIT sur un groupe entier, SOIT sur un seul établissement
//                            (XOR garanti par un CHECK), avec un rôle EFFECTIF qui peut
//                            différer de `restaurant_users.role`.
//
// Ces types sont le miroir de ce que l'ERP attend en retour. Toute divergence de nom
// ici = colonne vide à l'écran : ne renommer qu'en même temps que le backend.

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulaire du domaine
// ─────────────────────────────────────────────────────────────────────────────

/** Miroir de `com.lunionlab.turbo.restaurant.enums.TypeRoleRestaurant`. */
export type RolePartenaire = 'ADMIN' | 'OWNER' | 'COMPTABLE' | 'RESPO_LOG' | 'CAISSE' | 'MANAGER';

/** Étendue d'un accès : tout le groupe, ou un seul établissement. Jamais les deux. */
export type PorteeAcces = 'GROUPE' | 'RESTAURANT';

export const ROLE_PARTENAIRE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  OWNER: 'Propriétaire',
  COMPTABLE: 'Comptable',
  RESPO_LOG: 'Responsable logistique',
  CAISSE: 'Caisse',
  MANAGER: 'Manager',
};

export const PORTEE_ACCES_LABELS: Record<string, string> = {
  GROUPE: 'Tout le groupe',
  RESTAURANT: 'Un établissement',
};

// ─────────────────────────────────────────────────────────────────────────────
// Lectures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un compte partenaire vu par l'ERP, avec l'accès qu'il détient aujourd'hui.
 *
 * `accesId` est l'identifiant de la ligne `membre_acces`. Il est nul pour un compte
 * qui n'a encore que le repli historique `restaurant_users.restaurant_id` — cas
 * normal, et précisément ce que la constitution d'un groupe rend explicite.
 */
export interface IComptePartenaire {
  accesId: string | null;
  userId: string;
  nom: string | null;
  email: string | null;
  role: RolePartenaire | string | null;
  portee: PorteeAcces | string;
  /** Renseigné quand `portee === 'RESTAURANT'`. */
  restaurantId: string | null;
  restaurantNom: string | null;
}

/**
 * Un établissement proposé au sélecteur de constitution, avec les comptes qui y sont
 * rattachés et son appartenance actuelle à un groupe.
 *
 * Les comptes voyagent AVEC l'établissement : c'est ce qui permet de bâtir le
 * récapitulatif « compte par compte » sans un appel par établissement.
 */
export interface IEtablissementCandidat {
  restaurantId: string;
  nom: string | null;
  commune: string | null;
  /** Non nul = déjà dans un groupe : le rattacher ailleurs échouerait (UNIQUE en base). */
  groupeId: string | null;
  groupeNom: string | null;
  comptes: IComptePartenaire[];
}

/** Ligne de la liste des groupes. */
export interface IGroupeResume {
  id: string;
  nom: string;
  nbEtablissements: number;
  proprietaireUserId: string | null;
  proprietaireNom: string | null;
  proprietaireEmail: string | null;
  createdAt: string | null;
}

export interface IEtablissementDuGroupe {
  restaurantId: string;
  nom: string | null;
  commune: string | null;
  /** Nombre de comptes rattachés à cet établissement (accès de portée RESTAURANT). */
  nbComptes: number;
}

/** Fiche complète d'un groupe : ses établissements et tous ses membres. */
export interface IGroupeDetail {
  id: string;
  nom: string;
  createdAt: string | null;
  /** Le compte principal. Nul seulement si le compte a été supprimé entre-temps. */
  proprietaire: IComptePartenaire | null;
  etablissements: IEtablissementDuGroupe[];
  /** Accès de portée GROUPE et accès de portée RESTAURANT, dans la même liste. */
  membres: IComptePartenaire[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Écritures
// ─────────────────────────────────────────────────────────────────────────────

export interface ICreerGroupePayload {
  nom: string;
  restaurantIds: string[];
  /** Le compte principal, choisi PARMI les comptes des établissements sélectionnés. */
  proprietaireUserId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Récapitulatif avant validation — « on ne perd rien » se montre, ne se promet pas
// ─────────────────────────────────────────────────────────────────────────────

/** Ce qui arrive à un compte donné si l'administrateur valide. */
export type EffetSurCompte =
  /** Devient le compte principal : accès de portée GROUPE, rôle OWNER. */
  | 'DEVIENT_PRINCIPAL'
  /** Voit son périmètre s'élargir sans rien perdre. */
  | 'GAGNE'
  /** Ni gain ni perte : mêmes établissements, même rôle. */
  | 'INCHANGE'
  /** Perd l'accès à au moins un établissement. */
  | 'PERD';

export interface IEtablissementPerimetre {
  restaurantId: string;
  nom: string | null;
}

/** Une ligne du récapitulatif : un compte, son avant, son après. */
export interface ILigneRecapitulatif {
  userId: string;
  nom: string | null;
  email: string | null;
  effet: EffetSurCompte;
  roleAvant: string | null;
  roleApres: string | null;
  porteeAvant: PorteeAcces | string;
  porteeApres: PorteeAcces | string;
  perimetreAvant: IEtablissementPerimetre[];
  perimetreApres: IEtablissementPerimetre[];
  /** Ce que le compte gagne (jamais retiré de l'avant). */
  gains: IEtablissementPerimetre[];
  /** Ce que le compte perd. Doit rester vide sur une constitution. */
  pertes: IEtablissementPerimetre[];
  /** Phrase lisible par l'administrateur, sans jargon. */
  explication: string;
}

/** Ce qui EMPÊCHE la validation, par opposition à ce qui la nuance. */
export interface IBlocageRecapitulatif {
  restaurantId: string;
  nom: string | null;
  message: string;
}

export interface IRecapitulatif {
  lignes: ILigneRecapitulatif[];
  blocages: IBlocageRecapitulatif[];
  /** Compteurs dérivés des lignes — jamais écrits en dur. */
  nbComptes: number;
  nbAccesGagnes: number;
  nbAccesPerdus: number;
}
