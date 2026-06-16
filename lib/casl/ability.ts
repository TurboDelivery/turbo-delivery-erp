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

export function defineAbilityFor(role: AppRole | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // Accordé globalement, puis révoqué (cannot) pour les rôles qui ne doivent
  // pas voir le tableau de bord (STANDARD, AUTHENTIFICATION_VERIFICATION).
  // En CASL la dernière règle qui matche gagne → le cannot l'emporte.
  can('access', 'Analytics');

  switch (role) {
    case 'DG':
      can('manage', 'all');
      can('approuver-dg', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('rejeter-dg', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      break;

    case 'DGA':
      can('read', 'all');
      can('update', 'Incident'); // M7 — peut traiter les incidents (lecture via read-all)
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
      // Verification V1 (sujet dédié séparé de ValidationTicket, cf. plus haut).
      can('manage', 'VerificationV1');
      can('manage', 'VerrouillageV2');
      can('manage', 'GrillePaiement');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'COMPTABLE':
      can('read', 'Reporting'); // M6 — reporting & historisation
      can('read', ['ChargeFixe', 'ChargeVariable', 'Depense', 'Paiement', 'Livreur', 'Restaurant']);
      can('create', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('update', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('delete', ['ChargeFixe', 'ChargeVariable']);
      can('decaisser', ['ChargeFixe', 'ChargeVariable', 'Depense']);
      can('create', 'Ticket');
      can('read', 'Ticket');
      can('read', 'ValidationTicket');
      // Verification V1 (sujet dédié séparé de ValidationTicket, cf. plus haut).
      can('read', 'VerificationV1');
      // Historique des Créneaux (sujet dédié isolé de ValidationTicket pour le
      // cacher à AGENT_V1) — re-accordé ici pour préserver l'existant.
      can('read', 'HistoriqueCreneaux');
      can('read', 'VerrouillageV2');
      can('read', 'GrillePaiement');
      // V54 (2026-05) — Le COMPTABLE peut overrider l'inclusion d'une ligne
      // dans le "Total à payer" (action 'update-inclusion'). Backend audité
      // par JournalSecurite(LIGNE_INCLUSION_MODIFIEE) + justification ≥30c.
      can('update-inclusion', 'GrillePaiement');
      can('manage', 'Personnel');
      can('read', 'Finance');
      // 2026-05 (correction) — Le COMPTABLE (qui occupe la fonction de
      // Responsable Financier dans le workflow facture) ne doit voir et
      // mener des actions QUE sur "Responsable Financier" et "Caissier".
      // PAS "Agent Recouvreur" (vue terrain de l'agent recouvreur) ni
      // "Validation DGA" (vue DGA-only). Le DG et le DGA gardent l'accès
      // à toutes les sous-pages via leur 'manage all' / 'read all'.
      can('read', ['PageResponsableFinancier', 'PageCaissier', 'PageEncours']);
      // SPEC-RECOUV-002 — le Comptable voit l'écran de vérification des dépôts
      // (rapprochement visa↔bordereau + caisse). L'orientation reste DG/DGA.
      can('read', 'VerificationDepots');
      // 2026-05 — « Comptable - Agent V2 » (enrichissement du rôle Comptable, sur
      // choix user "enrichir") : reprend les droits opérationnels de l'Agent V1
      // en voir+modifier + Verrouillage V2 modifiable (peut valider V2) +
      // Dashboard Performance + module Finances en modification. Tout l'existant
      // ci-dessus est conservé (soumission grille→DGA, recouvrement/factures,
      // charges, comptabilité Resp.Financier+Caissier).
      can('manage', 'Trafic');
      can('manage', 'Livreur');             // Turboys > Men en voir+modifier
      can('manage', 'Creneau');             // Turboys > Créneaux
      can('manage', 'Performance');         // Turboys > Performance
      can('read', 'DashboardPerformance');  // Finance > Dashboard Performance
      can('manage', 'Commande');            // Courses externes (Nouvelles/Journalières/Toutes)
      can('authentifier', 'Ticket');
      can('manage', 'ValidationTicket');    // Régularisation en voir+modifier
      can('manage', 'VerificationV1');      // Verification V1 en voir+modifier (valide V1)
      can('manage', 'VerrouillageV2');      // Verrouillage V2 en voir+modifier (valide V2)
      can('manage', 'Finance');             // module Finances en voir+modifier
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      break;

    case 'OPS_MANAGER':
      can('read', 'Reporting'); // M6 — reporting & historisation
      can('read', ['Livreur', 'Restaurant', 'Ticket', 'Trafic', 'Commande']);
      can(['read', 'update'], 'Incident'); // M7 — supervision des incidents STANDARD
      // Sujets isolés pour AGENT_V1 (cf. AppSubjects) — re-accordés ici pour
      // préserver l'existant : "Commandes / Client", "Historique des Créneaux",
      // "Partenaires > Rapports Performance".
      can('read', ['CommandeClient', 'HistoriqueCreneaux', 'RapportPerformancePartenaire']);
      can('valider', 'Restaurant');
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'Creneau');
      can('manage', 'Performance');
      // Sous-menu "Finance > Dashboard Performance" (sujet dédié, cf. plus haut).
      can('read', 'DashboardPerformance');
      can('manage', 'ValidationTicket');
      // Verification V1 (sujet dédié séparé de ValidationTicket, cf. plus haut).
      can('manage', 'VerificationV1');
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
      // 2026-05 — « Agent de saisie - Standard » : saisie de tickets (création +
      // édition, SANS suppression) ; n'authentifie PAS, ne régularise PAS, ne
      // valide PAS (ni V1 ni V2). Trafic en voir+modifier. Menu Livreurs :
      // Créneaux voir+modifier, Liste des livreurs en lecture seule. Partenaires :
      // lecture seule. Rien d'autre.
      // NB : Notifications/Paramètres retirés du menu (spec) ; 'Menu'/'Route'
      // conservés (infra). Tableau de bord retiré (cannot Analytics).
      can('manage', 'Trafic');
      can(['read', 'update'], 'Incident');          // M7 — centre de contrôle STANDARD (file + transitions de statut)
      can(['read', 'create', 'update'], 'Ticket'); // créer + éditer (PAS delete/authentifier/valider)
      can('manage', 'Creneau');                     // Livreurs > Créneaux (voir+modifier)
      can('read', 'Livreur');                       // Livreurs > Liste des livreurs (lecture seule)
      can('read', 'Restaurant');                    // Partenaires (lecture seule)
      can('access', ['Menu', 'Route']);
      cannot('access', 'Analytics');
      break;

    case 'RESPONSABLE_VA':
      can('read', 'Reporting'); // M6 — reporting & historisation
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'ValidationTicket');
      // Verification V1 (sujet dédié séparé de ValidationTicket, cf. plus haut).
      can('manage', 'VerificationV1');
      // Sujets isolés pour AGENT_V1 — re-accordés pour préserver l'existant.
      can('read', ['HistoriqueCreneaux', 'RapportPerformancePartenaire']);
      can('manage', 'Livreur');
      can('read', 'Creneau');
      can('manage', 'Performance');
      // Sous-menu "Finance > Dashboard Performance" (sujet dédié, cf. plus haut).
      can('read', 'DashboardPerformance');
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
      can('read', 'Reporting'); // M6 — reporting & historisation
      // 2026-05 (révision après clarification user) — Le Directeur des
      // Opérations a les permissions d'OPS_MANAGER + l'accès au SEUL sous-menu
      // "Comptabilité > Agent Recouvreur" pour suivre les recouvrements terrain.
      //
      // Différence avec OPS_MANAGER : uniquement l'ajout de PageAgentRecouvreur.
      // Tout le reste est identique (tickets, validation, créneaux, performance,
      // grille paiement, etc.) — sauf "Dashboard Performance" sous Finance,
      // volontairement masqué (cf. plus bas : on ne donne PAS 'DashboardPerformance').
      //
      // PAS d'accès à : Comptabilité > Responsable Financier / Caissier /
      // Validation DGA, NI au module "Finance" principal (Charges, Validation,
      // Rapports Financiers, Rentabilité, Paiements, Revenus, Recouvrements).
      can('read', ['Livreur', 'Restaurant', 'Ticket', 'Trafic', 'Commande']);
      can(['read', 'update'], 'Incident'); // M7 — supervision des incidents STANDARD
      // Sujets isolés pour AGENT_V1 (cf. AppSubjects) — re-accordés ici pour
      // préserver l'existant : "Commandes / Client", "Historique des Créneaux",
      // "Partenaires > Rapports Performance".
      can('read', ['CommandeClient', 'HistoriqueCreneaux', 'RapportPerformancePartenaire']);
      can('valider', 'Restaurant');
      can('manage', 'Ticket');
      can('authentifier', 'Ticket');
      can('manage', 'Creneau');
      can('manage', 'Performance');
      can('manage', 'ValidationTicket');
      // Verification V1 (sujet dédié séparé de ValidationTicket, cf. plus haut).
      can('manage', 'VerificationV1');
      can('manage', 'GrillePaiement');
      // Spécifique DIRECTEUR_OPERATIONS — accès suivi recouvrement UNIQUEMENT.
      // PAS de can('read','Finance') : ça réafficherait le module "Finance"
      // principal. Le parent "Comptabilité" reste visible via son enfant
      // "Agent Recouvreur" (PageAgentRecouvreur) — filterMenuByAbility affiche
      // un parent dès qu'au moins un enfant passe. Le module "Finance" disparaît
      // donc entièrement : son seul enfant potentiellement visible pour ce rôle,
      // "Dashboard Performance", est gaté par 'DashboardPerformance' qu'on ne
      // donne pas ici (DO garde 'Performance' pour les autres menus perf).
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
      // SPEC-RECOUV-002 — le Caissier accède à l'écran de vérification pour
      // saisir l'attestation de comptage physique (contrôle des fonds conservés).
      can('read', 'VerificationDepots');
      break;

    case 'AUTHENTIFICATION_VERIFICATION':
      // 2026-05 — Agent d'authentification / vérification V1. Rôle volontairement
      // minimaliste : il valide les tickets en V1 et consulte les tickets des
      // courses externes. RIEN d'autre.
      //
      // VOIT : "Courses externes > Tickets" (read Ticket) et "Validation des
      // tickets > Verification V1" (read VerificationV1 — sujet dédié pour NE PAS
      // exposer Régularisation ni Historique des Créneaux, qui partagent
      // 'ValidationTicket'). + Notifications / Paramètres.
      //
      // NE VOIT PAS : tableau de bord (cannot Analytics ci-dessous), Approbation
      // finale (approuver-dg Ticket non accordé), Historique des Créneaux
      // (ValidationTicket non accordé), ni AUCUN module Finance (Finance / Page*
      // non accordés).
      can('read', 'Ticket');
      can('read', 'VerificationV1');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      // Tableau de bord retiré (Analytics accordé globalement plus haut).
      cannot('access', 'Analytics');
      break;

    case 'AGENT_V1':
      // Rôle « Agent V1 » (cadrage dépt développement, 2026-05) — périmètre
      // STRICT. Lecture + modification sur : Trafic, Turboys (Créneaux/Men/
      // Performance), Courses externes (Nouvelles/Journalières/Toutes + Tickets),
      // Validation des tickets > Régularisation + Verification V1.
      // Verrouillage V2 : CONSULTATION uniquement (read, PAS manage → les boutons
      // d'action V2 sont masqués, cf. verrouillage-v2-content). + Notifications /
      // Paramètres. RIEN d'autre.
      //
      // Chaîne ticket autorisée : créer, authentifier, valider V1. PAS de
      // 'manage Ticket' (sinon 'approuver-dg Ticket' réafficherait "Approbation
      // finale") → on liste des actions ciblées.
      //
      // Sujets volontairement NON accordés (isolés exprès, cf. AppSubjects) pour
      // tenir le périmètre — chacun partage un sujet avec une page autorisée :
      //   - PAS 'CommandeClient'              → cache "Commandes / Client"
      //   - PAS 'HistoriqueCreneaux'          → cache "Historique des Créneaux"
      //   - PAS 'RapportPerformancePartenaire' → cache "Partenaires > Rapports Performance"
      // Non accordés non plus : GrillePaiement, Visa DGA (valider-dga), Approbation
      // finale (approuver-dg), Restaurant/Partenaires, Personnel, Utilisateur,
      // Finance/Comptabilité, Analytics.
      can('manage', 'Trafic');
      can('manage', 'Livreur');
      can('manage', 'Creneau');
      can('manage', 'Performance');
      can('manage', 'Commande');
      can(['read', 'create', 'update', 'authentifier'], 'Ticket');
      can('manage', 'ValidationTicket');
      can('manage', 'VerificationV1');
      // Verrouillage V2 — consultation seule : PAS de 'manage' → l'UI masque les
      // actions (Valider V2 / Rejeter) pour qui n'a pas manage VerrouillageV2.
      can('read', 'VerrouillageV2');
      can('access', ['Menu', 'Route', 'Parametre', 'Notification']);
      // Pas de tableau de bord (non listé dans le périmètre).
      cannot('access', 'Analytics');
      break;

    case 'RESPONSABLE_AUTH_COUPONS':
      // 2026-05 — « Responsable Authentification de coupons ». Gère les tickets :
      // créer/éditer, AUTHENTIFIER, régulariser les retardés (page Régularisation).
      // NE VALIDE PAS (ni V1 ni V2). Menus en voir+modifier : Livreurs (Créneaux +
      // Liste), Partenaires, Trafic. Grille de paiement : consultation seule.
      // NB : « Contacts » = page inexistante dans l'app → non mappée (choix user).
      // Notifications/Paramètres hors périmètre (menu masqué) ; Menu/Route = infra.
      can('manage', 'Trafic');
      can('manage', 'Creneau');             // Menu Livreurs > Créneaux
      can('manage', 'Livreur');             // Menu Livreurs > Liste des livreurs
      can('manage', 'Restaurant');          // Menu Partners
      can('valider', 'Restaurant');
      // Tickets : créer/éditer + authentifier (PAS valider V1/V2). 'read Ticket'
      // affiche "Courses externes > Tickets" = la surface de gestion des tickets
      // (les 3 autres sous-pages Courses restent masquées, pas de 'Commande').
      can(['read', 'create', 'update', 'authentifier'], 'Ticket');
      can('manage', 'ValidationTicket');    // Régularisation (régulariser les tickets retardés)
      can('read', 'GrillePaiement');        // Grille de paiement : lecture seule
      can('access', ['Menu', 'Route']);
      cannot('access', 'Analytics');
      break;

    case 'ASSISTANT_COMPTABLE':
      // 2026-05 — « Assistant Comptable ». Tickets : voir+modifier, authentifier,
      // valider V1 ET V2. Module Finances : Charges + Validation uniquement
      // (voir+modifier). Module Comptabilité : Caissiers uniquement. Livreurs
      // (liste) + Partenaires : lecture seule. Rien d'autre.
      // NB : 'read Ticket' affiche "Courses externes > Tickets" (surface tickets).
      // Notifications/Paramètres hors périmètre (menu masqué) ; Menu/Route = infra.
      can(['read', 'create', 'update', 'authentifier'], 'Ticket');
      can('manage', 'VerificationV1');      // valider V1
      can('manage', 'VerrouillageV2');      // valider V2
      can('manage', 'ChargeFixe');          // Finances > Charges + Validation (voir+modifier)
      can('read', 'PageCaissier');          // Comptabilité > Caissier uniquement
      can('read', 'Livreur');               // Livreurs > Liste des livreurs (lecture seule)
      can('read', 'Restaurant');            // Partenaires (lecture seule)
      can('access', ['Menu', 'Route']);
      cannot('access', 'Analytics');
      break;

    default:
      break;
  }

  return build({
    detectSubjectType: (item) => (typeof item === 'string' ? item : (item as { __type?: AppSubjects }).__type) as ExtractSubjectType<InferSubjects<AppSubjects>>,
  });
}

export const anonymousAbility: AppAbility = defineAbilityFor(null);
