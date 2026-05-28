import { AbilityBuilder, createMongoAbility, type ExtractSubjectType, type InferSubjects, type MongoAbility } from '@casl/ability';

export type AppActions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'access' | 'valider' | 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser' | 'authentifier';

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
  | 'Commande'
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
  | 'Notification'
  | 'Creneau'
  | 'Performance'
  | 'ValidationTicket'
  | 'VerrouillageV2'
  | 'GrillePaiement'
  | 'all';

export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

export const APP_ROLES = ['TRESORIER', 'STANDARD', 'OPS_MANAGER', 'COMPTABLE', 'DGA', 'DG', 'BUSINESS_DEVELOPER', 'RESPONSABLE_VA','RECOUVREUR','CAISSIER','DIRECTEUR_OPERATIONS'] as const;
export type AppRole = (typeof APP_ROLES)[number];

const SESSION_ROLE_ALIASES: Record<string, AppRole> = {
  STANDARD: 'STANDARD',
  OPS_MANAGER: 'OPS_MANAGER',
  'OPS MANAGER': 'OPS_MANAGER',
  COMPTABLE: 'COMPTABLE',
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

export function defineAbilityFor(role: AppRole | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  can('access', 'Analytics');

  switch (role) {
    case 'DG':
      can('manage', 'all');
      can('approuver-dg', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('rejeter-dg', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      break;

    case 'DGA':
      can('read', 'all');
      // can('read', 'all') couvre déjà PageResponsableFinancier et PageAgentRecouvreur,
      // pas besoin de re-déclarer explicitement.
      can('create', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('update', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('delete', ['ChargeFixe', 'ChargeVariable']);
      can('valider-dga', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('rejeter-dga', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('decaisser', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('valider', 'Restaurant');
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'Creneau');
      can('manage', 'Performance');
      can('manage', 'ValidationTicket');
      can('manage', 'VerrouillageV2');
      can('manage', 'GrillePaiement');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'COMPTABLE':
      can('read', ['ChargeFixe', 'ChargeVariable', 'Depense', 'Paiement', 'Livreur', 'Restaurant']);
      can('create', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('update', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('delete', ['ChargeFixe', 'ChargeVariable']);
      can('decaisser', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('create', 'Ticket');
      can('read', 'Ticket');
      can('read', 'ValidationTicket');
      can('read', 'VerrouillageV2');
      can('read', 'GrillePaiement');
      can('manage', 'Personnel');
      can('read', 'Finance');
      // 2026-05 (correction) — Le COMPTABLE (qui occupe la fonction de
      // Responsable Financier dans le workflow facture) ne doit voir et
      // mener des actions QUE sur "Responsable Financier" et "Caissier".
      // PAS "Agent Recouvreur" (vue terrain de l'agent recouvreur) ni
      // "Validation DGA" (vue DGA-only). Le DG et le DGA gardent l'accès
      // à toutes les sous-pages via leur 'manage all' / 'read all'.
      can('read', ['PageResponsableFinancier', 'PageCaissier']);
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'OPS_MANAGER':
      can('read', ['Livreur', 'Restaurant', 'Ticket', 'Trafic', 'Commande']);
      can('valider', 'Restaurant');
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'Creneau');
      can('manage', 'Performance');
      can('manage', 'ValidationTicket');
      can('manage', 'GrillePaiement');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'BUSINESS_DEVELOPER':
      can('read', ['Livreur', 'Restaurant', 'Ticket']);
      can('create', 'Ticket');
      can('valider', 'Restaurant');
      can('manage', 'Creneau');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'STANDARD':
      can('read', 'Trafic');
      can('create', 'Ticket');
      can('read', 'Ticket');
      can('manage', 'Creneau');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'RESPONSABLE_VA':
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'ValidationTicket');
      can('manage', 'Livreur');
      can('read', 'Creneau');
      can('manage', 'Performance');
      can('manage', 'Restaurant');
      can('valider', 'Restaurant');
      can('manage', 'Trafic');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'RECOUVREUR':
      // Mêmes permissions que STANDARD
      can('read', 'Trafic');
      can('create', 'Ticket');
      can('read', 'Ticket');
      can('manage', 'Creneau');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      // + accès page agent-recouvreur UNIQUEMENT (pas Responsable Financier).
      // can('read', 'Finance') reste pour permettre l'accès au parent
      // "Comptabilité" du menu ; le sous-menu Responsable Financier est
      // filtré par la permission spécifique PageResponsableFinancier qu'on
      // ne donne PAS au RECOUVREUR (fix 2026-05).
      can('read', 'Finance');
      can('manage', 'Finance');
      can('read', 'PageAgentRecouvreur');
      // Note : PAS de can('read', 'PageResponsableFinancier') ici.
      break;

    case 'DIRECTEUR_OPERATIONS':
      // 2026-05 (révision après clarification user) — Le Directeur des
      // Opérations a EXACTEMENT les permissions d'OPS_MANAGER + l'accès au
      // sous-menu "Comptabilité > Agent Recouvreur" pour suivre les
      // recouvrements terrain.
      //
      // Différence avec OPS_MANAGER : uniquement l'ajout de Finance + Page
      // AgentRecouvreur. Tout le reste est identique (gestion tickets,
      // validation, créneaux, performance, grille paiement, etc.).
      //
      // PAS d'accès à : Comptabilité > Responsable Financier / Caissier /
      // Validation DGA, ni au menu Finance principal (Charges, Rapports
      // Financiers, etc.).
      can('read', ['Livreur', 'Restaurant', 'Ticket', 'Trafic', 'Commande']);
      can('valider', 'Restaurant');
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'Creneau');
      can('manage', 'Performance');
      can('manage', 'ValidationTicket');
      can('manage', 'GrillePaiement');
      // Spécifique DIRECTEUR_OPERATIONS — accès suivi recouvrement.
      can('read', 'Finance');
      can('read', 'PageAgentRecouvreur');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'TRESORIER':
      break;

    case 'CAISSIER':
      // 2026-05 (fix post-test mardi) — Le CAISSIER reçoit physiquement les
      // versements des agents recouvreurs dans le workflow facture (étape D2).
      // Avant ce fix : rôle absent de l'énumération → ability vide → page
      // /finance/comptabilite vide, aucun accès. Sans ces droits le métier
      // était cassé en prod.
      //
      // Mirror minimal du RECOUVREUR + accès Finance (vue comptabilité et
      // tableau des factures à confirmer).
      can('read', 'Trafic');
      can('create', 'Ticket');
      can('read', 'Ticket');
      can('manage', 'Creneau');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      // Accès vue comptabilité (lecture + actions sur les versements à confirmer).
      can('read', 'Finance');
      can('manage', 'Finance');
      // 2026-05 — Caissier a SA page dédiée + visibilité sur Responsable
      // Financier (factures à recevoir) et Agent Recouvreur (versements en cours).
      // PAS PageValidationDga (rôle DGA-only).
      can('read', ['PageResponsableFinancier', 'PageAgentRecouvreur', 'PageCaissier']);
      break;

    default:
      break;
  }

  return build({
    detectSubjectType: (item) => (typeof item === 'string' ? item : (item as { __type?: AppSubjects }).__type) as ExtractSubjectType<InferSubjects<AppSubjects>>,
  });
}

export const anonymousAbility: AppAbility = defineAbilityFor(null);
