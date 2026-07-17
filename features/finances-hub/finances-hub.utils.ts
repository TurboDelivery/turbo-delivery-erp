// Page Finances unifiée (template finances_template.html) — types + mapping + workflow.

export type FinanceStatut = 'pending' | 'vise' | 'approuve' | 'paye' | 'rejete';
export type FinanceType = 'fixe' | 'variable';

export interface IFinanceItem {
  id: string;
  type: FinanceType;
  designation: string;
  categorie: string;
  categorieId: string | null; // id de catégorie → filtre par catégorie
  montant: number;
  echeance: string; // libellé court (« le 7 » / « 07/04 »)
  date: string | null; // date brute (ISO) → filtre par mois ; null = récurrent (toujours affiché)
  statut: FinanceStatut;
  justif: boolean;
  src: string; // 'Auto' | 'Manuel' | 'RH'
  dyn: boolean; // montant dynamique (masse salariale RH)
}

/** Mappe les statuts backend (fixe & variable) vers le statut unifié du template. */
export function unifiedStatut(raw?: string | null): FinanceStatut {
  switch ((raw || '').toUpperCase()) {
    case 'VALIDE_DGA':
      return 'vise';
    case 'APPROUVE_DG':
    case 'A_DECAISSER':
      return 'approuve';
    case 'DECAISSE':
    case 'PAID':
      return 'paye';
    case 'REJETE_DGA':
    case 'REJETO_DGA':
    case 'REJETE_DG':
    case 'REJETO_DG':
      return 'rejete';
    default: // PENDING, EN_ATTENTE_DGA, null…
      return 'pending';
  }
}

const echeanceLabel = (jour?: number | null, date?: string | null): string => {
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  return jour ? `le ${jour}` : '—';
};

export function mapChargeFixe(cf: any): IFinanceItem {
  return {
    id: cf.id,
    type: 'fixe',
    designation: cf.designation,
    categorie: cf.categorie?.nomCategorie ?? '—',
    categorieId: cf.categorie?.id != null ? String(cf.categorie.id) : null,
    montant: cf.montant ?? 0,
    echeance: echeanceLabel(cf.echeanceJour, cf.dateEcheance),
    date: cf.dateEcheance ?? null,
    statut: unifiedStatut(cf.statut),
    justif: true,
    src: cf.codeSysteme ? 'RH' : cf.automatique ? 'Auto' : 'Manuel',
    dyn: !!cf.codeSysteme,
  };
}

export function mapChargeVariable(cv: any): IFinanceItem {
  return {
    id: cv.id,
    type: 'variable',
    designation: cv.designation,
    categorie: cv.categorie?.nomCategorie ?? '—',
    categorieId: cv.categorie?.id != null ? String(cv.categorie.id) : null,
    montant: cv.montant ?? 0,
    echeance: echeanceLabel(cv.echeanceJour, cv.dateDepense),
    date: cv.dateDepense ?? null,
    statut: unifiedStatut(cv.statut),
    justif: !!cv.justificatif,
    src: 'Manuel',
    dyn: false,
  };
}

/**
 * Accord DG OBLIGATOIRE pour TOUTES les depenses, quel que soit le montant.
 *
 * Regle metier (signalee le 2026-06-05) : le workflow standard est
 *   Comptable cree -> DGA vise -> DG approuve -> Comptable decaisse.
 * Pas de skip conditionnel selon un seuil. La signature garde les params seuil
 * et montant pour ne pas casser les appelants, mais la valeur est toujours true.
 *
 * Si un jour on veut reactiver une feature "auto-pass DG sous seuil", remplacer
 * le `true` par `(seuil > 0 && montant > seuil)` et la version precedente est
 * dispo dans l'historique git.
 */
export const needsDG = (_montant: number, _seuil: number) => true;

/** Prochaine action possible selon le statut + le seuil (null = rien à faire). */
export function nextAction(item: IFinanceItem, seuil: number): 'vise' | 'approuve' | 'pay' | null {
  if (item.statut === 'paye' || item.statut === 'rejete') return null;
  if (item.statut === 'pending') return 'vise';
  if (item.statut === 'vise') return needsDG(item.montant, seuil) ? 'approuve' : 'pay';
  if (item.statut === 'approuve') return 'pay';
  return null;
}

/** État des 4 étapes du Finance Stepper (Saisie → Visa DGA → Accord DG → Payé). */
export function steps(item: IFinanceItem, seuil: number) {
  const s = item.statut;
  return {
    saisie: true,
    visa: ['vise', 'approuve', 'paye'].includes(s),
    dg: needsDG(item.montant, seuil) ? ['approuve', 'paye'].includes(s) : 'skip',
    paye: s === 'paye',
    rejete: s === 'rejete',
  } as const;
}

const ESPACES = new RegExp('[\\u202f\\u00a0]', 'g');
export const fmtFcfa = (n?: number | null) =>
  n === null || n === undefined
    ? '—'
    : `${(n < 0 ? '-' : '') + Math.abs(Math.round(n)).toLocaleString('fr-FR').replace(ESPACES, ' ')} FCFA`;
