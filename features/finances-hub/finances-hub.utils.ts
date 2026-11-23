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
  /**
   * Le jour où la charge a été DÉCAISSÉE (ISO), ou null tant qu'elle ne l'est pas. C'est la
   * colonne « Payée le » des exports. Facultatif : les fixtures d'avant n'en portent pas.
   */
  payeeLe?: string | null;
  /**
   * Le compte de trésorerie débité, retenu au décaissement : la colonne « Compte » des
   * exports. Null tant que la charge n'est pas payée, et sur tout paiement antérieur à
   * la saisie du compte (le serveur ne le gardait pas).
   */
  compte?: string | null;
  /** Code du moyen de paiement (voir {@link MOYENS_PAIEMENT}), ou null. */
  moyen?: string | null;
}

/**
 * Les moyens de paiement d'un décaissement. Le CODE part au serveur, qui tient la même
 * liste (enum `MoyenDecaissement`) et refuse toute autre valeur : si les deux divergent,
 * le décaissement échoue avec un message, il ne garde pas une valeur fausse.
 */
export const MOYENS_PAIEMENT = [
  { code: 'ESPECES', libelle: 'Espèces' },
  { code: 'CHEQUE', libelle: 'Chèque' },
  { code: 'MOBILE_MONEY', libelle: 'Mobile Money' },
  { code: 'VIREMENT', libelle: 'Virement' },
] as const;

/** Le libellé d'un code de moyen ; un code inconnu est rendu tel quel, jamais masqué. */
export const libelleMoyen = (code?: string | null): string =>
  code ? (MOYENS_PAIEMENT.find((m) => m.code === code)?.libelle ?? code) : '—';

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
    payeeLe: cf.dateDecaissement ?? null,
    compte: cf.compteTresorerie ?? null,
    moyen: cf.moyenPaiement ?? null,
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
    payeeLe: cv.dateDecaissement ?? null,
    compte: cv.compteTresorerie ?? null,
    moyen: cv.moyenPaiement ?? null,
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

/* ------------------------------------------------------------------------- *
 *  LE FILTRE DU TABLEAU : recherche libre + etape de la cascade
 * ------------------------------------------------------------------------- */

/**
 * Comparaison insensible a la CASSE et aux ACCENTS.
 *
 * <p>Sans le depliage NFD, chercher « electricite » ne trouve pas « Électricité », et
 * l'operateur en conclut qu'il n'y a rien. Les designations sont saisies a la main, avec
 * et sans accents selon la personne et le clavier : la recherche doit les reunir.</p>
 */
export const normaliserTexte = (v: string) =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Les valeurs du selecteur « Étape ». `tous` ne filtre pas. */
export type EtapeFiltre = 'approuve' | 'pay' | 'paye' | 'rejete' | 'tous' | 'vise';

/**
 * Les etapes de la cascade, dans l'ordre ou une charge les franchit.
 *
 * <p>C'est le filtre qui sert a DECAISSER VITE : on choisit « À décaisser », on coche la
 * page ou tout le resultat, on decaisse. Il parle le vocabulaire de l'ACTION ATTENDUE et
 * non celui du statut stocke, parce que c'est la question que se pose l'operateur devant
 * l'ecran : qu'est-ce qui m'attend, moi, maintenant.</p>
 */
export const ETAPES = [
  { label: 'Toutes les étapes', value: 'tous' },
  { label: 'À viser (DGA)', value: 'vise' },
  { label: 'À approuver (DG)', value: 'approuve' },
  { label: 'À décaisser', value: 'pay' },
  { label: 'Payées', value: 'paye' },
  { label: 'Rejetées', value: 'rejete' },
] as const;

/**
 * Reduit la liste du mois a ce que l'operateur cherche.
 *
 * <p>⚠ L'etape se lit par `nextAction`, PAS par `statut`, et c'est deliberе. Aujourd'hui
 * les deux diraient la meme chose : `needsDG` est epingle a `true` dans ce depot, le saut
 * d'accord DG sous seuil ayant ete retire, donc une charge `vise` attend toujours le DG.
 * Mais le jour ou ce saut revient — la fonction garde ses parametres pour cela — une
 * petite charge visee deviendra payable sans accord DG. Un filtre ecrit sur `statut` la
 * ferait alors disparaitre de « À décaisser » pendant que sa ligne afficherait le bouton
 * « Decaisser » : l'ecran se contredirait tout seul. En appelant la meme fonction que le
 * bouton, le filtre et le bouton ne PEUVENT pas diverger.</p>
 *
 * <p>`paye` et `rejete`, eux, se lisent bien sur `statut` : ce sont des etats terminaux,
 * pour lesquels `nextAction` rend `null`.</p>
 *
 * <p>La categorie est cherchee AVEC la designation : on tape « LOYERS » comme on tape
 * « Loyer », sans avoir a se demander lequel des deux champs on interroge.</p>
 */
export function filtrerItems(
  items: IFinanceItem[],
  critere: { etape: string; recherche: string },
  seuil: number,
): IFinanceItem[] {
  const q = normaliserTexte(critere.recherche.trim());
  const etape = critere.etape || 'tous';
  if (!q && etape === 'tous') return items;
  return items.filter((i) => {
    if (q && !normaliserTexte(`${i.designation} ${i.categorie}`).includes(q)) return false;
    if (etape === 'tous') return true;
    if (etape === 'paye') return i.statut === 'paye';
    if (etape === 'rejete') return i.statut === 'rejete';
    return nextAction(i, seuil) === etape;
  });
}

// ── La sélection de la planche « Dépenses — analyse par catégorie » ──────────────

/** Les cinq statuts, dans l'ordre du circuit. Ce sont les bascules du filtre Statut. */
export const STATUTS_FINANCE: { cle: FinanceStatut; libelle: string }[] = [
  { cle: 'pending', libelle: 'En attente' },
  { cle: 'vise', libelle: 'Visé DGA' },
  { cle: 'approuve', libelle: 'Approuvé DG' },
  { cle: 'paye', libelle: 'Payé' },
  { cle: 'rejete', libelle: 'Rejeté' },
];

/** Par défaut : tout sauf Rejeté (maquette). Une rejetée ne se montre que si on la demande. */
export const STATUTS_PAR_DEFAUT: FinanceStatut[] = ['pending', 'vise', 'approuve', 'paye'];

/**
 * Réduit le mois à la sélection : statuts cochés ET recherche.
 *
 * <p>C'est LA sélection. Les onglets, les cartes, le tableau, son pied et l'export en
 * partent tous : deux chemins de filtrage, c'est deux totaux qui finissent par diverger.</p>
 */
export function filtrerSelection(
  items: IFinanceItem[],
  critere: { recherche: string; statuts: FinanceStatut[] },
): IFinanceItem[] {
  const q = normaliserTexte(critere.recherche.trim());
  const statuts = new Set(critere.statuts);
  return items.filter((i) => {
    if (!statuts.has(i.statut)) return false;
    return !q || normaliserTexte(`${i.designation} ${i.categorie}`).includes(q);
  });
}

export interface IStatsSelection {
  /** Opérations comptées : les rejetées n'en sont pas. */
  n: number;
  total: number;
  moyenne: number;
  min: number;
  max: number;
  paye: number;
  nbPayees: number;
  reste: number;
  nbReste: number;
  /** Rejetées AFFICHÉES dans la sélection, mais non comptées. */
  nbRejetees: number;
  parCategorie: { categorie: string; n: number; total: number }[];
}

/**
 * Les chiffres de la sélection.
 *
 * <p>⚠ UNE REJETÉE S'AFFICHE MAIS NE SE COMPTE PAS (maquette) : elle n'a rien coûté et ne
 * coûtera rien. La compter gonflerait le total de sommes qui ne sortiront jamais.</p>
 */
export function statsSelection(items: IFinanceItem[]): IStatsSelection {
  const comptees = items.filter((i) => i.statut !== 'rejete');
  const somme = (l: IFinanceItem[]) => l.reduce((s, i) => s + i.montant, 0);
  const payees = comptees.filter((i) => i.statut === 'paye');
  const restantes = comptees.filter((i) => i.statut !== 'paye');
  const montants = comptees.map((i) => i.montant);
  const total = somme(comptees);

  const parCle = new Map<string, { categorie: string; n: number; total: number }>();
  for (const i of comptees) {
    const c = parCle.get(i.categorie) ?? { categorie: i.categorie, n: 0, total: 0 };
    c.n += 1;
    c.total += i.montant;
    parCle.set(i.categorie, c);
  }

  return {
    max: montants.length ? Math.max(...montants) : 0,
    min: montants.length ? Math.min(...montants) : 0,
    moyenne: comptees.length ? total / comptees.length : 0,
    n: comptees.length,
    nbPayees: payees.length,
    nbRejetees: items.length - comptees.length,
    nbReste: restantes.length,
    parCategorie: Array.from(parCle.values()).sort((a, b) => b.total - a.total),
    paye: somme(payees),
    reste: somme(restantes),
    total,
  };
}

export type CleTri = 'echeance' | 'montant';

/**
 * Trie la sélection sur l'échéance ou le montant.
 *
 * <p>⚠ L'échéance se trie sur la DATE brute, pas sur son libellé : « 07/04 » et « le 7 »
 * rangés comme du texte mettraient le 10 avant le 2. Une charge sans date (récurrente)
 * va à la fin, dans les deux sens.</p>
 */
export function trierSelection(items: IFinanceItem[], cle: CleTri, sens: 'asc' | 'desc'): IFinanceItem[] {
  const f = sens === 'asc' ? 1 : -1;
  return items.slice().sort((a, b) => {
    if (cle === 'montant') return (a.montant - b.montant) * f;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * f;
  });
}
