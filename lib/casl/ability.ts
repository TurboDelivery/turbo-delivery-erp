import { AbilityBuilder, createMongoAbility, type ExtractSubjectType, type InferSubjects, type MongoAbility } from '@casl/ability';

export type AppActions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'access' | 'valider' | 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser' | 'authentifier' | 'update-inclusion';

export type AppSubjects =
  | 'ChargeFixe'
  | 'ChargeVariable'
  | 'Depense'
  | 'Paiement'
  | 'Ticket'
  | 'Livreur'
  | 'Restaurant'
  | 'Menu'
  | 'Route'
  | 'Analytics'
  | 'Parametre'
  | 'Trafic'
  // M7 (2026-06) — Sous-module « STANDARD » (incidents) de TRAFIC, isolé de
  // 'Trafic' pour un gating dédié du centre de contrôle /trafic/standard.
  | 'Incident'
  // M6 (2026-06) — Reporting & historisation transverse (RG-11/21), écran /reporting.
  | 'Reporting'
  | 'Commande'
  // 2026-05 — "Commandes / Client" (menu racine, /commandes) isolé de 'Commande'
  // (qui gate les sous-pages Courses externes Nouvelles/Journalières/Toutes) pour
  // pouvoir le CACHER au rôle AGENT_V1 sans masquer les courses externes.
  // Re-accordé à OPS_MANAGER + DIRECTEUR_OPERATIONS (DG/DGA via all).
  | 'CommandeClient'
  | 'Personnel'
  | 'Utilisateur'
  | 'Finance'
  // 2026-05 — Sous-menus dédiés du module Comptabilité pour contrôle granulaire
  // de visibilité. Le sujet général "Finance" reste utilisé par les autres
  // pages (recouvrement, dashboard, etc.) ; ici on isole ces 2 sous-pages
  // pour pouvoir les autoriser séparément.
  // - PageResponsableFinancier → vue Comptable/DGA/DG/Caissier (validation factures, etc.)
  //   Pas accordé au RECOUVREUR qui ne doit voir QUE sa vue Agent.
  // - PageAgentRecouvreur → vue Agent recouvreur (encaissements terrain).
  //   Accordé au RECOUVREUR + Comptable/DGA/DG/Caissier pour suivi.
  | 'PageResponsableFinancier'
  | 'PageAgentRecouvreur'
  // - PageCaissier → vue Caissier (réception physique versements).
  //   Accordé au CAISSIER + COMPTABLE + DGA + DG. PAS au RECOUVREUR.
  // - PageValidationDga → vue dédiée Validation DGA. Accordé DGA + DG seulement
  //   (le COMPTABLE est limité à Responsable Financier + Caissier per fix 2026-05).
  | 'PageCaissier'
  | 'PageValidationDga'
  // SPEC-RECOUV-002 — écrans aval du visa du workflow recouvrement.
  // OrientationFonds : décision DG/DGA (banque/caisse) — réservé DG/DGA (via all).
  // VerificationDepots : rapprochement visa↔bordereau + caisse — Comptable/DGA/DG/Caissier.
  | 'OrientationFonds'
  | 'VerificationDepots'
  // PageEncours : relevé des restes à payer (factures éditées non recouvrées), module
  // Comptabilité. Accès Comptable + DGA/DG (via read/manage all). Demandeur : DGA.
  | 'PageEncours'
  // PageFinanceConfig : configuration globale du module FINANCES (§4.1).
  // Réservé DG (manage all) + DGA (read all, propose le seuil). « Admin » = DG côté front.
  | 'PageFinanceConfig'
  | 'Notification'
  | 'Creneau'
  | 'Performance'
  // 2026-05 — "Finance > Dashboard Performance" isolé sur son propre sujet (au
  // lieu de 'Performance' partagé) pour pouvoir le masquer au
  // DIRECTEUR_OPERATIONS sans impacter les autres menus Performance. Sinon, DO
  // possédant 'Performance', ce sous-menu survivait et faisait réapparaître
  // tout le parent "Finance" (filterMenuByAbility affiche un parent dès qu'AU
  // MOINS un enfant passe). Accordé : DG/DGA (via 'all'), OPS_MANAGER,
  // RESPONSABLE_VA. PAS DIRECTEUR_OPERATIONS.
  | 'DashboardPerformance'
  // 2026-05 — "Partenaires > Rapports Performance" (/finance/rapports-performance)
  // isolé de 'Performance' (qui gate "Turboys > performance") pour pouvoir le
  // CACHER au rôle AGENT_V1 sans masquer la performance Turboys. Re-accordé à
  // OPS_MANAGER + RESPONSABLE_VA + DIRECTEUR_OPERATIONS (DG/DGA via all).
  | 'RapportPerformancePartenaire'
  | 'ValidationTicket'
  // 2026-05 — "Validation des tickets > Verification V1" isolé sur son propre
  // sujet (séparé de 'ValidationTicket', partagé avec Régularisation et
  // Historique des Créneaux) pour pouvoir l'accorder SEUL au rôle agent V1
  // AUTHENTIFICATION_VERIFICATION. Accordé aussi à DG(all)/DGA/COMPTABLE/
  // OPS_MANAGER/RESPONSABLE_VA/DIRECTEUR_OPERATIONS pour préserver l'existant.
  | 'VerificationV1'
  // 2026-05 — "Validation des tickets > Historique des Créneaux" isolé de
  // 'ValidationTicket' (partagé avec Régularisation) pour pouvoir le CACHER au
  // rôle AGENT_V1 (qui voit Régularisation) sans exposer tout l'historique de
  // paie. Re-accordé à COMPTABLE + OPS_MANAGER + RESPONSABLE_VA +
  // DIRECTEUR_OPERATIONS (DG/DGA via all).
  | 'HistoriqueCreneaux'
  | 'VerrouillageV2'
  | 'GrillePaiement'
  // 2026-06 — Page « Approbation finale » réservée au DG/PDG. Sujet dédié car
  // le DGA a 'manage Ticket' + 'read all' : un garde read/Ticket le laisserait
  // passer. Seul le DG (manage all) satisfait 'approuver-dg' PageApprobationFinale.
  | 'PageApprobationFinale'
  | 'all';

export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

export const APP_ROLES = ['TRESORIER', 'STANDARD', 'OPS_MANAGER', 'COMPTABLE', 'DGA', 'DG', 'BUSINESS_DEVELOPER', 'RESPONSABLE_VA','RECOUVREUR','CAISSIER','DIRECTEUR_OPERATIONS','AUTHENTIFICATION_VERIFICATION','AGENT_V1','RESPONSABLE_AUTH_COUPONS','ASSISTANT_COMPTABLE'] as const;
export type AppRole = (typeof APP_ROLES)[number];

const SESSION_ROLE_ALIASES: Record<string, AppRole> = {
  STANDARD: 'STANDARD',
  // « Agent de saisie - Standard » = le rôle STANDARD redéfini (cf. case STANDARD).
  'AGENT DE SAISIE': 'STANDARD',
  'AGENT DE SAISIE - STANDARD': 'STANDARD',
  OPS_MANAGER: 'OPS_MANAGER',
  'OPS MANAGER': 'OPS_MANAGER',
  COMPTABLE: 'COMPTABLE',
  // « Comptable - Agent V2 » = enrichissement du rôle COMPTABLE (cf. case COMPTABLE).
  'COMPTABLE - AGENT V2': 'COMPTABLE',
  // Nouveaux rôles 2026-05 (cadrage dépt développement).
  RESPONSABLE_AUTH_COUPONS: 'RESPONSABLE_AUTH_COUPONS',
  'RESPONSABLE AUTHENTIFICATION DE COUPONS': 'RESPONSABLE_AUTH_COUPONS',
  'RESPONSABLE AUTH COUPONS': 'RESPONSABLE_AUTH_COUPONS',
  ASSISTANT_COMPTABLE: 'ASSISTANT_COMPTABLE',
  'ASSISTANT COMPTABLE': 'ASSISTANT_COMPTABLE',
  DGA: 'DGA',
  DG: 'DG',
  ADMIN: 'DG',
  TRESORIER: 'TRESORIER',
  RECOUVREUR: 'RECOUVREUR',
  'AGENT RECOUVREUR': 'RECOUVREUR',
  CAISSIER: 'CAISSIER',
  DIRECTEUR_OPERATIONS: 'DIRECTEUR_OPERATIONS',
  'DIRECTEUR DES OPERATIONS': 'DIRECTEUR_OPERATIONS',
  'DIRECTEUR DES OPÉRATIONS': 'DIRECTEUR_OPERATIONS',
  AUTHENTIFICATION_VERIFICATION: 'AUTHENTIFICATION_VERIFICATION',
  'AUTHENTIFICATION VERIFICATION': 'AUTHENTIFICATION_VERIFICATION',
  // Rôle « Agent V1 » (cadrage dépt développement 2026-05). normalizeRole met
  // en MAJUSCULES + trim → "Agent V1" devient "AGENT V1".
  AGENT_V1: 'AGENT_V1',
  'AGENT V1': 'AGENT_V1',
  BUSINESS_DEVELOPER: 'BUSINESS_DEVELOPER',
  'BUSINESS DEVELOPER': 'BUSINESS_DEVELOPER',
  "CENTRALE D'APPEL": 'STANDARD',
  'RESPONSABLE V&A': 'RESPONSABLE_VA',
  'RESPONSBALE V&A': 'RESPONSABLE_VA',
};

export function normalizeRole(raw?: string | { libelle?: string } | null): AppRole | null {
  if (!raw) return null;
  const libelle = typeof raw === 'string' ? raw : raw.libelle;
  if (!libelle) return null;
  const key = libelle.toUpperCase().trim().replace(/['']/g, "'");
  return SESSION_ROLE_ALIASES[key] ?? null;
}

/**
 * Refactor 2026-07 (option C) — SOURCE UNIQUE de vérité des privilèges : chaque
 * rôle = une liste de règles {action, subject}, au lieu du `switch` codé en dur
 * (équivalence règle-par-règle vérifiée sur les 15 rôles + anonyme avant de
 * retirer l'ancien switch).
 * Ordre significatif : BASE_RULES puis les règles du rôle ; en CASL la DERNIÈRE
 * règle qui matche gagne, donc un `cannot` en fin de liste révoque (ex. retirer
 * le tableau de bord). La page /parametres/privileges affiche cette matrice.
 */
export interface PermissionRule {
  /** 'can' par défaut ; 'cannot' révoque (placé après les 'can' concernés). */
  effect?: 'can' | 'cannot';
  action: AppActions | AppActions[];
  subject: AppSubjects | 'all' | (AppSubjects | 'all')[];
}

/** Règles accordées à TOUS les rôles, appliquées avant les règles spécifiques. */
export const BASE_RULES: PermissionRule[] = [
  { action: 'access', subject: 'Analytics' },
];

/** Permissions par rôle (ordre significatif — les `cannot` finaux révoquent). */
export const ROLE_RULES: Record<AppRole, PermissionRule[]> = {
  DG: [
    { action: 'manage', subject: 'all' },
    { action: 'approuver-dg', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'rejeter-dg', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
  ],
  DGA: [
    { action: 'read', subject: 'all' },
    { action: 'update', subject: 'Incident' },
    { action: 'create', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'update', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'delete', subject: ['ChargeFixe', 'ChargeVariable'] },
    { action: 'valider-dga', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'rejeter-dga', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'decaisser', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'valider', subject: 'Restaurant' },
    { action: 'manage', subject: 'Ticket' },
    { action: 'authentifier', subject: 'Ticket' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'manage', subject: 'Performance' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'manage', subject: 'VerrouillageV2' },
    { action: 'manage', subject: 'GrillePaiement' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
  ],
  COMPTABLE: [
    { action: 'read', subject: 'Reporting' },
    { action: 'read', subject: ['ChargeFixe', 'ChargeVariable', 'Depense', 'Paiement', 'Livreur', 'Restaurant'] },
    { action: 'create', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'update', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'delete', subject: ['ChargeFixe', 'ChargeVariable'] },
    { action: 'decaisser', subject: ['ChargeFixe', 'ChargeVariable', 'Depense'] },
    { action: 'create', subject: 'Ticket' },
    { action: 'read', subject: 'Ticket' },
    { action: 'read', subject: 'ValidationTicket' },
    { action: 'read', subject: 'VerificationV1' },
    { action: 'read', subject: 'HistoriqueCreneaux' },
    { action: 'read', subject: 'VerrouillageV2' },
    { action: 'read', subject: 'GrillePaiement' },
    { action: 'update-inclusion', subject: 'GrillePaiement' },
    { action: 'manage', subject: 'Personnel' },
    { action: 'read', subject: 'Finance' },
    { action: 'read', subject: ['PageResponsableFinancier', 'PageCaissier', 'PageEncours'] },
    { action: 'read', subject: 'VerificationDepots' },
    { action: 'manage', subject: 'Trafic' },
    { action: 'manage', subject: 'Livreur' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'manage', subject: 'Performance' },
    { action: 'read', subject: 'DashboardPerformance' },
    { action: 'read', subject: 'RapportPerformancePartenaire' },
    { action: 'manage', subject: 'Commande' },
    { action: 'authentifier', subject: 'Ticket' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'manage', subject: 'VerrouillageV2' },
    { action: 'manage', subject: 'Finance' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
  ],
  OPS_MANAGER: [
    { action: 'read', subject: 'Reporting' },
    { action: 'read', subject: ['Livreur', 'Restaurant', 'Ticket', 'Trafic', 'Commande'] },
    { action: ['read', 'update'], subject: 'Incident' },
    { action: 'read', subject: ['CommandeClient', 'HistoriqueCreneaux', 'RapportPerformancePartenaire'] },
    { action: 'valider', subject: 'Restaurant' },
    { action: 'manage', subject: 'Ticket' },
    { action: 'authentifier', subject: 'Ticket' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'manage', subject: 'Performance' },
    { action: 'read', subject: 'DashboardPerformance' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'manage', subject: 'GrillePaiement' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
  ],
  BUSINESS_DEVELOPER: [
    { action: 'read', subject: ['Livreur', 'Restaurant', 'Ticket'] },
    { action: 'create', subject: 'Ticket' },
    { action: 'valider', subject: 'Restaurant' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
  ],
  STANDARD: [
    { action: 'manage', subject: 'Trafic' },
    { action: ['read', 'update'], subject: 'Incident' },
    { action: ['read', 'create', 'update'], subject: 'Ticket' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'read', subject: 'Livreur' },
    { action: 'read', subject: 'Restaurant' },
    { action: 'access', subject: ['Menu', 'Route'] },
    { effect: 'cannot', action: 'access', subject: 'Analytics' },
  ],
  RESPONSABLE_VA: [
    { action: 'read', subject: 'Reporting' },
    { action: 'manage', subject: 'Ticket' },
    { action: 'authentifier', subject: 'Ticket' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'read', subject: ['HistoriqueCreneaux', 'RapportPerformancePartenaire'] },
    { action: 'manage', subject: 'Livreur' },
    { action: 'read', subject: 'Creneau' },
    { action: 'manage', subject: 'Performance' },
    { action: 'read', subject: 'DashboardPerformance' },
    { action: 'manage', subject: 'Restaurant' },
    { action: 'valider', subject: 'Restaurant' },
    { action: 'manage', subject: 'Trafic' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
  ],
  RECOUVREUR: [
    { action: 'read', subject: 'Trafic' },
    { action: 'create', subject: 'Ticket' },
    { action: 'read', subject: 'Ticket' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
    { action: 'read', subject: 'Finance' },
    { action: 'manage', subject: 'Finance' },
    { action: 'read', subject: 'PageAgentRecouvreur' },
  ],
  DIRECTEUR_OPERATIONS: [
    { action: 'read', subject: 'Reporting' },
    { action: 'read', subject: ['Livreur', 'Restaurant', 'Ticket', 'Trafic', 'Commande'] },
    { action: ['read', 'update'], subject: 'Incident' },
    { action: 'read', subject: ['CommandeClient', 'HistoriqueCreneaux', 'RapportPerformancePartenaire'] },
    { action: 'valider', subject: 'Restaurant' },
    { action: 'manage', subject: 'Ticket' },
    { action: 'authentifier', subject: 'Ticket' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'manage', subject: 'Performance' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'manage', subject: 'GrillePaiement' },
    { action: 'read', subject: 'PageAgentRecouvreur' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
  ],
  TRESORIER: [],
  CAISSIER: [
    { action: 'read', subject: 'Trafic' },
    { action: 'create', subject: 'Ticket' },
    { action: 'read', subject: 'Ticket' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
    { action: 'read', subject: 'Finance' },
    { action: 'manage', subject: 'Finance' },
    { action: 'read', subject: ['PageResponsableFinancier', 'PageAgentRecouvreur', 'PageCaissier'] },
    { action: 'read', subject: 'VerificationDepots' },
  ],
  AUTHENTIFICATION_VERIFICATION: [
    { action: 'read', subject: 'Ticket' },
    { action: 'read', subject: 'VerificationV1' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
    { effect: 'cannot', action: 'access', subject: 'Analytics' },
  ],
  AGENT_V1: [
    { action: 'manage', subject: 'Trafic' },
    { action: 'manage', subject: 'Livreur' },
    { action: 'manage', subject: 'Creneau' },
    { action: 'manage', subject: 'Performance' },
    { action: 'manage', subject: 'Commande' },
    { action: ['read', 'create', 'update', 'authentifier'], subject: 'Ticket' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'read', subject: 'VerrouillageV2' },
    { action: 'access', subject: ['Menu', 'Route', 'Parametre', 'Notification'] },
    { effect: 'cannot', action: 'access', subject: 'Analytics' },
  ],
  RESPONSABLE_AUTH_COUPONS: [
    { action: 'manage', subject: 'Trafic' },
    { action: 'manage', subject: 'Restaurant' },
    { action: 'valider', subject: 'Restaurant' },
    { action: ['read', 'create', 'update', 'authentifier'], subject: 'Ticket' },
    { action: 'manage', subject: 'ValidationTicket' },
    { action: 'access', subject: ['Menu', 'Route'] },
    { effect: 'cannot', action: 'access', subject: 'Analytics' },
  ],
  ASSISTANT_COMPTABLE: [
    { action: ['read', 'create', 'update', 'authentifier'], subject: 'Ticket' },
    { action: 'manage', subject: 'VerificationV1' },
    { action: 'manage', subject: 'VerrouillageV2' },
    { action: 'manage', subject: 'ChargeFixe' },
    { action: 'read', subject: 'PageCaissier' },
    { action: 'read', subject: 'Livreur' },
    { action: 'read', subject: 'Restaurant' },
    { action: 'access', subject: ['Menu', 'Route'] },
    { effect: 'cannot', action: 'access', subject: 'Analytics' },
  ],
};

type AbilityCan = AbilityBuilder<AppAbility>['can'];

function appliquerRegles(can: AbilityCan, cannot: AbilityCan, rules: PermissionRule[]): void {
  for (const r of rules) {
    const fn = r.effect === 'cannot' ? cannot : can;
    fn(r.action as Parameters<AbilityCan>[0], r.subject as Parameters<AbilityCan>[1]);
  }
}

export function defineAbilityFor(role: AppRole | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  appliquerRegles(can, cannot, BASE_RULES);
  if (role) appliquerRegles(can, cannot, ROLE_RULES[role] ?? []);
  return build({
    detectSubjectType: (item) => (typeof item === 'string' ? item : (item as { __type?: AppSubjects }).__type) as ExtractSubjectType<InferSubjects<AppSubjects>>,
  });
}

export const anonymousAbility: AppAbility = defineAbilityFor(null);
