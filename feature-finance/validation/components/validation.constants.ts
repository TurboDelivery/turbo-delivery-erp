import { ActionWorkflow } from '@/feature-finance/charges/queries/charge-variable.mutation';
import { IChargeVariable } from '@/feature-finance/charges/types/charge-variable.type';
import { IChargeFixe } from '@/feature-finance/charges/types/charge-fixe.type';
import { IDepense } from '@/features/depenses/types/depense.type';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type Role   = 'comptable' | 'dga' | 'dg';
export type SubTab = 'validation' | 'historique';
export type ChargeType = 'variable' | 'fixe';

// ─── Mapping Role interne → rôle backend (majuscules) ────────────────────────
export const ROLE_TO_BACKEND: Record<Role, string> = {
  comptable: 'COMPTABLE',
  dga: 'DGA',
  dg: 'DG',
};

// ─── Statuts workflow ──────────────────────────────────────────────────────────
export const S_EN_ATTENTE_DGA = 'En attente validation DGA';
export const S_EN_ATTENTE_DG  = 'En attente validation DG';
export const S_VUE_DGA        = 'Viré par DGA';
export const S_VERIFIE_DGA    = 'Vérifié par DGA';
export const S_APPROUVE       = 'Approuvé pour paiement';
export const S_DECAISSE       = 'Décaissé';
export const S_REJETE_DGA     = 'Annulé par DGA';
export const S_REJETE_DG      = 'Rejeté par DG';

export const STATUTS_TERMINAUX = [
  S_DECAISSE, S_VUE_DGA, S_REJETE_DGA, S_REJETE_DG,
  'DECAISSE', 'PAID', 'REJETE_DGA', 'REJETE_DG',
];

// ─── Mapping API statut → statut page ─────────────────────────────────────────
export const CV_STATUT_TO_PAGE: Record<string, string> = {
  PENDING:        S_EN_ATTENTE_DGA,
  EN_ATTENTE_DGA: S_EN_ATTENTE_DGA,
  VALIDE_DGA:     S_EN_ATTENTE_DG,
  REJETE_DGA:     S_REJETE_DGA,
  APPROUVE_DG:    S_APPROUVE,
  REJETE_DG:      S_REJETE_DG,
  DECAISSE:       S_DECAISSE,
  PAID:           S_DECAISSE,
};

// ─── Mapping role → ActionWorkflow ────────────────────────────────────────────
export const ROLE_ACCEPT_ACTION: Record<string, ActionWorkflow> = {
  comptable: 'decaisser',
  dga:       'valider-dga',
  dg:        'approuver-dg',
};
export const ROLE_REJECT_ACTION: Record<string, ActionWorkflow> = {
  comptable: 'rejeter-dg',
  dga:       'rejeter-dga',
  dg:        'rejeter-dg',
};

// ─── Rôles autorisés & mapping session → Role interne ────────────────────────
const SESSION_ROLE_MAP: Record<string, Role> = {
  ADMIN: 'dg',
  DG: 'dg',
  DGA: 'dga',
  COMPTABLE: 'comptable',
};

export function sessionRoleToRole(sessionRole?: string): Role | null {
  const normalized = (sessionRole ?? '').toUpperCase().trim();
  return SESSION_ROLE_MAP[normalized] ?? null;
}

// ─── Config par rôle ─────────────────────────────────────────────────────────
export const ROLE_CONFIG: Record<Role, { label: string; description: string; acceptLabel: string }> = {
  comptable: { label: 'Comptable', description: 'Saisie des dépenses', acceptLabel: 'Décaisser' },
  dga:       { label: 'DGA',       description: 'Validation des dépenses', acceptLabel: 'Viser' },
  dg:        { label: 'DG',        description: 'Approbation des dépenses', acceptLabel: 'Approuver' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function fmtDate(d?: string | null) {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return d;
  }
}

export function isDGAPending(statut: string) {
  return statut === S_EN_ATTENTE_DGA;
}
export function isDGPending(statut: string) {
  return statut === S_EN_ATTENTE_DG;
}
export function isComptablePending(statut: string) {
  return statut === S_APPROUVE;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
export function chargeVariableToDepense(cv: IChargeVariable): IDepense {
  return {
    id:             cv.id,
    libelle:        cv.designation,
    montant:        cv.montant,
    description:    cv.description,
    dateDepense:    cv.createdAt.split('T')[0],
    typeDepense:    'VARIABLE',
    sourcePaiement: undefined,
    statut:         CV_STATUT_TO_PAGE[cv.statut] ?? cv.statut,
    categorie:      cv.categorie
      ? { id: cv.categorie.id, nomCategorie: cv.categorie.nomCategorie, description: cv.categorie.description ?? '' }
      : { id: '', nomCategorie: '—', description: '' },
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };
}

export function chargeFixeToDepense(cf: IChargeFixe): IDepense {
  let effectiveStatut = cf.statut as string;
  if (cf.statut === 'PENDING' || cf.statut === 'EN_ATTENTE_DGA' || cf.statut === 'VALIDE_DGA') {
    if (cf.approuvePar && cf.dateApprobationDG) {
      effectiveStatut = 'APPROUVE_DG';
    } else if (cf.validePar && cf.dateValidationDGA) {
      effectiveStatut = 'VALIDE_DGA';
    }
  }
  return {
    id:             cf.id,
    libelle:        cf.designation,
    montant:        cf.montant,
    description:    undefined,
    dateDepense:    cf.createdAt.split('T')[0],
    typeDepense:    'FIXE',
    sourcePaiement: 'Prélèvement automatique',
    statut:         CV_STATUT_TO_PAGE[effectiveStatut] ?? effectiveStatut,
    categorie:      cf.categorie
      ? { id: cf.categorie.id, nomCategorie: cf.categorie.nomCategorie, description: cf.categorie.description ?? '' }
      : { id: '', nomCategorie: '—', description: '' },
    createdAt: cf.createdAt,
    updatedAt: cf.updatedAt,
  };
}
