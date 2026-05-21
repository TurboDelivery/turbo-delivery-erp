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
  | 'Notification'
  | 'Creneau'
  | 'Performance'
  | 'ValidationTicket'
  | 'VerrouillageV2'
  | 'GrillePaiement'
  | 'all';

export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

export const APP_ROLES = ['TRESORIER', 'STANDARD', 'OPS_MANAGER', 'COMPTABLE', 'DGA', 'DG', 'BUSINESS_DEVELOPER', 'RESPONSABLE_VA','RECOUVREUR'] as const;
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
      can('read', 'Finance');
      can('manage', 'Finance');
      can('read', ['Restaurant', 'Livreur']);
      can('access', ['Menu', 'Route', 'Notification']);
      break;

    case 'TRESORIER':
      break;

    default:
      break;
  }

  return build({
    detectSubjectType: (item) => (typeof item === 'string' ? item : (item as { __type?: AppSubjects }).__type) as ExtractSubjectType<InferSubjects<AppSubjects>>,
  });
}

export const anonymousAbility: AppAbility = defineAbilityFor(null);
