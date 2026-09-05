// SPEC-ERP-TURBO-AUDIT-v2.0 — Supervision des sessions & audit global des activités.
//
// Miroir exact des view-models du backend `main-backend`, package
// `com.lunionlab.turbo.audit.vm` (SessionErpVm, AuditActionVm, ConnexionVm,
// AdoptionVm, SupervisionStatsVm). Toute divergence de nom ici = colonne vide
// à l'écran : ne renommer qu'en même temps que le VM Java correspondant.

// ─────────────────────────────────────────────────────────────────────────────
// F1/F2 — Présences (sessions ERP)
// ─────────────────────────────────────────────────────────────────────────────

/** Déduit du dernier battement de cœur ; `FERMEE` n'apparaît que sur le détail d'une session. */
export type StatutActivite = 'ACTIF' | 'INACTIF' | 'EN_INSTANCE' | 'FERMEE';

/**
 * Une session ERP telle que servie par `GET /api/erp/supervision/en-ligne`.
 *
 * Aucune URL n'y figure volontairement : le backend ne publie que le couple
 * fonctionnel `moduleCourant` / `ecranCourant` (« Finances » › « Clôture de
 * caisse »), conformément à la spec.
 */
export interface ISessionErp {
  id: string;
  utilisateurId: string | null;
  utilisateur: string | null;
  role: string | null;
  agence: string | null;
  loginAt: string | null;
  lastSeenAt: string | null;
  statutActivite: StatutActivite | string;
  /** Secondes écoulées depuis le dernier battement de cœur. */
  inactifDepuisS: number;
  moduleCourant: string | null;
  ecranCourant: string | null;
  ecranPrecedent: string | null;
  pageDepuis: string | null;
  surPageDepuisS: number | null;
  ip: string | null;
  appareil: string | null;
  logoutAt: string | null;
  logoutType: string | null;
  forceeParNom: string | null;
  /** Durée figée côté serveur ; l'écran la ré-incrémente à partir de `loginAt`. */
  dureeSessionS: number;
}

/** Réponse de `POST /api/erp/supervision/sessions/{id}/forcer-deconnexion`. */
export interface IForcerDeconnexionResultat {
  session: ISessionErp;
  message: string;
}

export interface ISessionsFiltre {
  agence: string;
  /** '' = tous ; sinon une valeur de {@link StatutActivite}. */
  statut: string;
  recherche: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI
// ─────────────────────────────────────────────────────────────────────────────

export interface ISupervisionStats {
  enLigne: number;
  actions24h: number;
  jamaisConnectes: number;
  echecs24h: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// F5 — Actions métier
// ─────────────────────────────────────────────────────────────────────────────

export type TypeAction =
  | 'CREATION'
  | 'MODIFICATION'
  | 'SUPPRESSION'
  | 'VALIDATION'
  | 'ANNULATION'
  | 'CHANGEMENT_STATUT'
  | 'EXPORT'
  | 'IMPRESSION'
  | 'DROITS'
  | 'CONSULTATION_AUDIT';

/** Ligne du journal des actions (`GET /api/erp/audit/actions`). */
export interface IAuditAction {
  id: string;
  occurredAt: string;
  utilisateurId: string | null;
  utilisateur: string | null;
  role: string | null;
  sessionId: string | null;
  module: string | null;
  ecran: string | null;
  typeAction: TypeAction | string;
  entiteType: string | null;
  entiteId: string | null;
  entiteLibelle: string | null;
  /** Champs réellement modifiés uniquement — c'est ce qui rend le détail lisible. */
  valeursAvant: Record<string, unknown> | null;
  valeursApres: Record<string, unknown> | null;
  httpMethode: string | null;
  chemin: string | null;
  statutHttp: number | null;
  dureeMs: number | null;
  ip: string | null;
  succes: boolean;
  erreur: string | null;
}

export interface IActionsFiltre {
  module: string;
  typeAction: string;
  recherche: string;
  /** `YYYY-MM-DD` ou instant ISO — le backend accepte les deux. */
  depuis: string;
  jusqua: string;
  page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// F4 — Connexions
// ─────────────────────────────────────────────────────────────────────────────

export type TypeEvenementConnexion = 'LOGIN' | 'ECHEC' | 'LOGOUT' | 'EXPIRATION' | 'FORCEE';

/**
 * Ligne du journal des connexions (`GET /api/erp/audit/connexions`).
 *
 * Sur un échec portant sur un identifiant inconnu, `utilisateur` et
 * `utilisateurId` sont nuls : seul `identifiant` (ce qui a été saisi) est
 * renseigné. C'est voulu, ce sont les tentatives qu'un auditeur cherche.
 */
export interface IConnexion {
  id: string;
  occurredAt: string;
  utilisateurId: string | null;
  utilisateur: string | null;
  identifiant: string | null;
  typeEvenement: TypeEvenementConnexion | string;
  motif: string | null;
  sessionId: string | null;
  ip: string | null;
  appareil: string | null;
  dureeSessionS: number | null;
}

export interface IConnexionsFiltre {
  typeEvenement: string;
  recherche: string;
  depuis: string;
  jusqua: string;
  page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// F3 — Adoption des comptes (premières connexions)
// ─────────────────────────────────────────────────────────────────────────────

export interface IAdoptionCompte {
  utilisateurId: string | null;
  identifiant: string | null;
  utilisateur: string | null;
  role: string | null;
  /** Figé en base par trigger (V112) : jamais réécrit. */
  premiereConnexionAt: string | null;
  derniereConnexionAt: string | null;
  nbConnexions: number;
  jamaisConnecte: boolean;
}

/**
 * `annuaireDisponible = false` signifie que l'annuaire ERP était injoignable :
 * la liste ne contient alors que les comptes ayant déjà laissé une trace, donc
 * **aucun** compte jamais connecté. L'écran doit alerter plutôt que d'afficher
 * « 0 jamais connecté », qui serait un contresens.
 */
export interface IAdoptionResultat {
  annuaireDisponible: boolean;
  total: number;
  jamaisConnectes: number;
  comptes: IAdoptionCompte[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Libellés & couleurs (français, ton back-office)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les tons sémantiques de la bibliothèque, et rien de plus.
 *
 * <p>La v2 offrait `primary` et `secondary` comme COULEURS de pastille ; la v3 les a
 * déplacés sur `variant`, où ils disent une intensité, pas un sens.</p>
 */
export type ChipCouleur = 'danger' | 'default' | 'success' | 'warning';

export const STATUT_ACTIVITE_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  EN_INSTANCE: 'En instance',
  FERMEE: 'Fermée',
};

/** Une session inactive n'est pas un avertissement : c'est une absence d'activité. */
export const STATUT_ACTIVITE_COULEURS: Record<string, ChipCouleur> = {
  ACTIF: 'success',
  EN_INSTANCE: 'default',
  FERMEE: 'default',
  INACTIF: 'default',
};

export const TYPE_ACTION_LABELS: Record<string, string> = {
  CREATION: 'Création',
  MODIFICATION: 'Modification',
  SUPPRESSION: 'Suppression',
  VALIDATION: 'Validation / clôture',
  ANNULATION: 'Annulation',
  CHANGEMENT_STATUT: 'Changement de statut',
  EXPORT: 'Export de données',
  IMPRESSION: 'Impression',
  DROITS: 'Modification de droits',
  CONSULTATION_AUDIT: "Consultation de l'audit",
};

/**
 * Le ton d'une action d'audit.
 *
 * <p>« Modification » était en `primary` — la couleur de MARQUE — alors que c'est
 * l'action ORDINAIRE de ce journal : elle en compose la quasi-totalité, et la peindre
 * revenait à colorer toute la colonne. « Validation » était en ambre, « Changement de
 * statut » en `secondary`. Ce qui se distingue, c'est ce qui CRÉE, ce qui DÉTRUIT, et ce
 * qui touche aux DROITS.</p>
 */
export const TYPE_ACTION_COULEURS: Record<string, ChipCouleur> = {
  ANNULATION: 'danger',
  CHANGEMENT_STATUT: 'default',
  CONSULTATION_AUDIT: 'default',
  CREATION: 'success',
  DROITS: 'danger',
  EXPORT: 'default',
  IMPRESSION: 'default',
  MODIFICATION: 'default',
  SUPPRESSION: 'danger',
  VALIDATION: 'default',
};

/** Ordre d'affichage du filtre « Action » (aligné sur l'énum backend TypeAction). */
export const TYPES_ACTION: TypeAction[] = [
  'CREATION',
  'MODIFICATION',
  'SUPPRESSION',
  'VALIDATION',
  'ANNULATION',
  'CHANGEMENT_STATUT',
  'EXPORT',
  'IMPRESSION',
  'DROITS',
  'CONSULTATION_AUDIT',
];

export const TYPE_EVENEMENT_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  ECHEC: 'Échec',
  LOGOUT: 'Déconnexion manuelle',
  EXPIRATION: 'Expiration',
  FORCEE: 'Déconnexion forcée',
};

/**
 * Le ton d'un événement de connexion.
 *
 * <p>Une déconnexion ordinaire était en `primary` — la couleur de MARQUE — et une
 * expiration de session en ambre : ce sont les fins NORMALES d'une session, elles n'ont
 * rien à signaler. Reste ce qu'un auditeur cherche dans ce journal : la connexion
 * réussie, l'échec, et la déconnexion FORCÉE.</p>
 */
export const TYPE_EVENEMENT_COULEURS: Record<string, ChipCouleur> = {
  ECHEC: 'danger',
  EXPIRATION: 'default',
  FORCEE: 'danger',
  LOGIN: 'success',
  LOGOUT: 'default',
};

export const TYPES_EVENEMENT: TypeEvenementConnexion[] = ['LOGIN', 'ECHEC', 'LOGOUT', 'EXPIRATION', 'FORCEE'];

/** Onglets de l'écran — sert aussi à nommer le fichier d'export. */
export type OngletSupervision = 'en-ligne' | 'activite' | 'connexions' | 'adoption';

/**
 * Export CSV de l'onglet actif. Chaque panneau publie le sien au montage : le
 * bouton d'export vit dans l'entête de page (comme la maquette) mais seul le
 * panneau connaît son jeu de données filtré, et HeroUI ne monte que l'onglet
 * sélectionné — la fonction publiée est donc toujours celle de l'onglet visible.
 */
export type ExporteurOnglet = () => void | Promise<void>;
