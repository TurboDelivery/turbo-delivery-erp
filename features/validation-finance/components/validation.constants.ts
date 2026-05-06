import { ActionWorkflow } from '@/features/charges/queries/charge-variable.mutation';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { IHistoriqueCharge } from '@/features/charges/types/historique-charge.type';
import { IDepense } from '@/features/depenses/types/depense.type';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type Role   = 'comptable' | 'dga' | 'dg';
export type SubTab = 'validation' | 'historique';
export type ChargeType = 'variable' | 'fixe';

// â”€â”€â”€ Mapping Role interne â†’ rÃ´le backend (majuscules) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ROLE_TO_BACKEND: Record<Role, string> = {
  comptable: 'COMPTABLE',
  dga: 'DGA',
  dg: 'DG',
};

// â”€â”€â”€ Statuts workflow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const S_EN_ATTENTE_DGA = 'En attente validation DGA';
export const S_EN_ATTENTE_DG  = 'En attente validation DG';
export const S_VUE_DGA        = 'VirÃ© par DGA';
export const S_VERIFIE_DGA    = 'VÃ©rifiÃ© par DGA';
export const S_APPROUVE       = 'ApprouvÃ© pour paiement';
export const S_DECAISSE       = 'DÃ©caissÃ©';
export const S_REJETE_DGA     = 'AnnulÃ© par DGA';
export const S_REJETE_DG      = 'RejetÃ© par DG';

export const STATUTS_TERMINAUX = [
  S_DECAISSE, S_VUE_DGA, S_REJETE_DGA, S_REJETE_DG,
  'DECAISSE', 'PAID', 'REJETE_DGA', 'REJETE_DG',
];

// â”€â”€â”€ Mapping API statut â†’ statut page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Mapping role â†’ ActionWorkflow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ RÃ´les autorisÃ©s & mapping session â†’ Role interne â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Config par rÃ´le â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ROLE_CONFIG: Record<Role, { label: string; description: string; acceptLabel: string }> = {
  comptable: { label: 'Comptable', description: 'Saisie des dÃ©penses', acceptLabel: 'DÃ©caisser' },
  dga:       { label: 'DGA',       description: 'Validation des dÃ©penses', acceptLabel: 'Viser' },
  dg:        { label: 'DG',        description: 'Approbation des dÃ©penses', acceptLabel: 'Approuver' },
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function fmtDate(d?: string | null) {
  if (!d) return 'â€”';
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

// â”€â”€â”€ Mappers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function chargeVariableToDepense(cv: IChargeVariable): IDepense {
  return {
    id:             cv.id,
    libelle:        cv.designation,
    montant:        cv.montant,
    description:    cv.description,
    justificatif:   cv.justificatif,
    dateDepense:    cv.createdAt.split('T')[0],
    typeDepense:    'VARIABLE',
    sourcePaiement: undefined,
    statut:         CV_STATUT_TO_PAGE[cv.statut] ?? cv.statut,
    categorie:      cv.categorie
      ? { id: cv.categorie.id, nomCategorie: cv.categorie.nomCategorie, description: cv.categorie.description ?? '' }
      : { id: '', nomCategorie: 'â€”', description: '' },
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };
}

export function historiqueChargeToDepense(hc: IHistoriqueCharge): IDepense {
  const dateRef = hc.dateRef ?? hc.createdAt;
  return {
    id:             hc.id,
    libelle:        hc.designation,
    montant:        hc.montant,
    description:    undefined,
    dateDepense:    (dateRef ?? '').split('T')[0],
    typeDepense:    hc.type,
    sourcePaiement: hc.type === 'FIXE' ? 'PrÃ©lÃ¨vement automatique' : undefined,
    statut:         CV_STATUT_TO_PAGE[hc.statut] ?? hc.statut,
    categorie:      hc.categorie
      ? { id: hc.categorie.id, nomCategorie: hc.categorie.nomCategorie, description: hc.categorie.description ?? '' }
      : { id: '', nomCategorie: 'â€”', description: '' },
    createdAt: hc.createdAt,
    updatedAt: hc.updatedAt,
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
    sourcePaiement: 'PrÃ©lÃ¨vement automatique',
    statut:         CV_STATUT_TO_PAGE[effectiveStatut] ?? effectiveStatut,
    categorie:      cf.categorie
      ? { id: cf.categorie.id, nomCategorie: cf.categorie.nomCategorie, description: cf.categorie.description ?? '' }
      : { id: '', nomCategorie: 'â€”', description: '' },
    createdAt: cf.createdAt,
    updatedAt: cf.updatedAt,
  };
}

