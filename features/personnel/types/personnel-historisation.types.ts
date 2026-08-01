/**
 * Types du volet « historisation du personnel » (SPEC-ERP-TURBO-PERSONNEL-v1.1).
 *
 * Miroir exact des VM du main-backend (`com.lunionlab.turbo.vm.personnel`) : rien n'est
 * inventé ici, chaque champ correspond à un champ servi par l'API. Les écrans existants
 * (Employés / Congés / Déductions / Paiements) continuent d'utiliser
 * `features/personnel/types/types.ts` — ce fichier ne remplace rien, il ajoute.
 */

// ─────────────────────────────────────────────────────────────────────────────
// F3 — rémunération mensuelle d'un agent
// ─────────────────────────────────────────────────────────────────────────────

/** Origine d'une retenue : déduction du module Déductions, saisie manuelle, régularisation. */
export interface IRetenueDetail {
  motif: string | null;
  montant: number | null;
  source: string | null;
  type: string | null;
  reference: string | null;
  date: string | null;
}

/** Correction d'un mois clôturé, payée sur un mois ouvert (règle 2 : un mois clos est figé). */
export interface IRemunerationRegularisation {
  id: string;
  moisEcriture: string;
  moisOrigine: string;
  moisOrigineLibelle: string;
  base: number | null;
  primes: number | null;
  retenues: number | null;
  net: number | null;
  motif: string | null;
  statut: string | null;
}

export type SensEcart = 'GAIN' | 'PERTE' | 'STABLE' | null;

/** Un mois de la frise de rémunération d'un agent. */
export interface IRemunerationMois {
  id: string | null;
  employeId: string;
  mois: string;
  moisLibelle: string;
  base: number | null;
  primes: number | null;
  retenues: number | null;
  net: number | null;
  netRegularisations: number | null;
  netTotal: number | null;
  ecart: number | null;
  ecartPourcent: number | null;
  sensEcart: SensEcart;
  statut: string | null;
  saisi: boolean;
  cloture: boolean;
  modePaiement: string | null;
  datePaiement: string | null;
  commentaire: string | null;
  detailRetenues: IRetenueDetail[] | null;
  regularisations: IRemunerationRegularisation[] | null;
}

/**
 * Corps de `POST /api/erp/personnel/remunerations/regularisation`.
 *
 * Règle 2 de la spec : un mois clôturé ne se réécrit jamais. La correction est une écriture
 * datée d'un mois OUVERT qui déclare le mois clôturé qu'elle rattrape, avec son motif —
 * obligatoire côté serveur, sans quoi la régularisation serait inexploitable.
 */
export interface IRegularisationRemuneration {
  employeId: string;
  /** Mois ouvert sur lequel la correction est payée, format `YYYY-MM`. */
  moisOuvert: string;
  /** Mois clôturé que l'on corrige, format `YYYY-MM`. */
  moisOrigine: string;
  base?: number | null;
  primes?: number | null;
  retenues?: number | null;
  modePaiement?: string | null;
  datePaiement?: string | null;
  motif: string;
}

export interface IRemunerationHistorique {
  employeId: string;
  nom: string | null;
  matricule: string | null;
  poste: string | null;
  agence: string | null;
  typeCollaborateur: string | null;
  statut: string | null;
  dateEntree: string | null;
  sortieLe: string | null;
  moisEnrolement: string | null;
  dernierMoisCloture: string | null;
  netDernierMois: number | null;
  netMoyen: number | null;
  totalPercu: number | null;
  mois: IRemunerationMois[];
}

// ─────────────────────────────────────────────────────────────────────────────
// F4 — masse salariale
// ─────────────────────────────────────────────────────────────────────────────

export type StatutMois = 'OUVERT' | 'CLOTURE';

export interface IMasseSalarialeLigne {
  employeId: string;
  nom: string | null;
  matricule: string | null;
  poste: string | null;
  agence: string | null;
  typeCollaborateur: string | null;
  base: number | null;
  primes: number | null;
  retenues: number | null;
  net: number | null;
  modePaiement: string | null;
  datePaiement: string | null;
  statut: string | null;
  /** `INSTANTANE` (mois clôturé, chiffres figés) ou `LIVE` (mois ouvert, recalculé). */
  source: string | null;
  saisi: boolean;
  /** Mois d'origine quand la ligne est une régularisation payée sur ce mois-ci. */
  regularisationDe: string | null;
  detailRetenues: IRetenueDetail[] | null;
}

export interface IMasseSalariale {
  mois: string;
  moisLibelle: string;
  statut: StatutMois | string;
  source: string | null;
  clotureLe: string | null;
  clotureParNom: string | null;
  effectif: number;
  nbLignes: number;
  totalBase: number | null;
  totalPrimes: number | null;
  totalRetenues: number | null;
  totalNet: number | null;
  netMoyen: number | null;
  repartition: Record<string, unknown> | null;
  lignes: IMasseSalarialeLigne[];
}

export interface IMasseSalarialeMois {
  mois: string;
  moisLibelle: string;
  statut: StatutMois | string;
  effectif: number;
  totalNet: number | null;
  totalRetenues: number | null;
  clotureLe: string | null;
  clotureParNom: string | null;
  cloturable: boolean;
}

export interface IMouvementEffectif {
  employeId: string;
  nom: string | null;
  matricule: string | null;
  poste: string | null;
  agence: string | null;
  typeCollaborateur: string | null;
  net: number | null;
}

export interface IMasseSalarialeComparaison {
  mois: string;
  moisLibelle: string;
  statut: string;
  moisPrecedent: string | null;
  moisPrecedentLibelle: string | null;
  statutPrecedent: string | null;
  totalNet: number | null;
  totalNetPrecedent: number | null;
  ecartNet: number | null;
  ecartPourcent: number | null;
  sensEcart: SensEcart;
  effectif: number;
  effectifPrecedent: number;
  ecartEffectif: number;
  entrees: IMouvementEffectif[];
  sorties: IMouvementEffectif[];
}

// ─────────────────────────────────────────────────────────────────────────────
// F6 — anomalies
// ─────────────────────────────────────────────────────────────────────────────

export type GraviteAnomalie = 'CRITIQUE' | 'A_TRAITER' | 'A_VERIFIER';

/** Codes servis par `AnomaliePersonnelService` — utilisés pour dériver l'état de déclaration. */
export const CODE_ANOMALIE = {
  CONTRAT_NON_DECLARE: 'CONTRAT_NON_DECLARE',
  CONTRAT_EXPIRE: 'CONTRAT_EXPIRE',
  CONTRAT_ECHEANCE: 'CONTRAT_ECHEANCE',
  DECLARATION_INCONNUE: 'DECLARATION_INCONNUE',
  PROFIL_INCOMPLET: 'PROFIL_INCOMPLET',
  SANS_REMUNERATION: 'SANS_REMUNERATION',
  SORTI_PAYE: 'SORTI_PAYE',
  DOUBLON: 'DOUBLON',
} as const;

export interface IAnomaliePersonnel {
  type: string;
  typeLibelle: string | null;
  gravite: GraviteAnomalie | string;
  libelle: string;
  employeId: string | null;
  employeNom: string | null;
  matricule: string | null;
  detail: string | null;
  employesLies: string[] | null;
}

export interface IAnomaliesPersonnel {
  calculeLe: string;
  employesAnalyses: number;
  total: number;
  totalFiltre: number;
  parGravite: Record<string, number>;
  parType: Record<string, number>;
  typesDisponibles: { code: string; libelle: string; gravite: string }[];
  anomalies: IAnomaliePersonnel[];
}

// ─────────────────────────────────────────────────────────────────────────────
// F1 / F2 / F5 — dossier, parcours, contrats, pièces
// ─────────────────────────────────────────────────────────────────────────────

export interface IEmployeFiche {
  id: string;
  matricule: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  agence: string | null;
  typeCollaborateur: string | null;
  salary: number | null;
  statut: string | null;
  entryDate: string | null;
  dateNaissance: string | null;
  genre: string | null;
  adresse: string | null;
  photoUrl: string | null;
  pieceType: string | null;
  pieceNumero: string | null;
  pieceUrl: string | null;
  pieceExpireLe: string | null;
  urgenceNom: string | null;
  urgenceTelephone: string | null;
  urgenceLien: string | null;
  livreurId: string | null;
  utilisateurErpId: string | null;
  enregistreLe: string | null;
  enregistrePar: string | null;
  enregistreParNom: string | null;
  sortieLe: string | null;
  sortieMotif: string | null;
  sorti: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IEmployeContrat {
  id: string;
  employeId: string;
  typeContrat: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  pieceUrl: string | null;
  /** `null` = état de déclaration jamais renseigné, à distinguer de `false` = non déclaré. */
  declare: boolean | null;
  dateDeclaration: string | null;
  referenceDeclaration: string | null;
  declarationUrl: string | null;
  actif: boolean;
  clotureLe: string | null;
  clotureMotif: string | null;
  createdAt: string | null;
  joursAvantEcheance: number | null;
  echeanceDepassee: boolean;
  employeNom: string | null;
  employeMatricule: string | null;
}

/**
 * Corps de `PATCH /api/erp/personnel/contrats/{id}/declaration`.
 *
 * `declare = null` remet l'état à « inconnu » : ce n'est pas la même chose que « non
 * déclaré », et l'écran doit pouvoir dire les trois.
 */
export interface IContratDeclaration {
  declare: boolean | null;
  dateDeclaration?: string | null;
  referenceDeclaration?: string | null;
  declarationUrl?: string | null;
}

export interface IEmployeEvenement {
  id: string;
  employeId: string;
  typeEvenement: string;
  typeLibelle: string | null;
  dateEffective: string | null;
  dateSaisie: string | null;
  auteurId: string | null;
  auteurNom: string | null;
  motif: string | null;
  details: Record<string, unknown> | null;
}

export interface IEmployePiece {
  id: string;
  employeId: string;
  categorie: string | null;
  libelle: string | null;
  url: string | null;
  ajoutePar: string | null;
  ajouteParNom: string | null;
  createdAt: string | null;
}

export interface IEmployeDossier {
  fiche: IEmployeFiche;
  contratActif: IEmployeContrat | null;
  contrats: IEmployeContrat[];
  parcours: IEmployeEvenement[];
  pieces: IEmployePiece[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit — historique des modifications d'une fiche
// ─────────────────────────────────────────────────────────────────────────────

export interface IAuditActionFiche {
  id: string;
  occurredAt: string;
  utilisateurId: string | null;
  utilisateur: string | null;
  role: string | null;
  sessionId: string | null;
  module: string | null;
  ecran: string | null;
  typeAction: string | null;
  entiteType: string | null;
  entiteId: string | null;
  entiteLibelle: string | null;
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

// ─────────────────────────────────────────────────────────────────────────────
// Effectif — vue composée côté client
// ─────────────────────────────────────────────────────────────────────────────

export type EtatDeclaration = 'DECLARE' | 'NON_DECLARE' | 'INCONNU' | 'NON_APPLICABLE';

/**
 * Ligne de l'onglet Effectif.
 *
 * ⚠ Il n'existe pas (encore) d'endpoint `GET /api/erp/personnel/effectif` : cette ligne est
 * composée côté client à partir du roster `/api/erp/employees`, des lignes de masse salariale
 * (matricule, agence, type, net) et du tableau d'anomalies (état de déclaration). Le jour où
 * le backend expose l'effectif enrichi, `obtenirEffectif()` devient un simple GET et ce type
 * ne bouge pas.
 */
export interface IEffectifLigne {
  employeId: string;
  nom: string;
  matricule: string | null;
  poste: string | null;
  agence: string | null;
  typeCollaborateur: string | null;
  enroleLe: string | null;
  actif: boolean;
  sortieLe: string | null;
  declaration: EtatDeclaration;
  netDernierMoisCloture: number | null;
  nbAnomalies: number;
}

export interface IEffectif {
  lignes: IEffectifLigne[];
  /** Mois dont provient la colonne « net du dernier mois clôturé » (null si aucune clôture). */
  dernierMoisCloture: string | null;
  dernierMoisClotureLibelle: string | null;
  totalActifs: number;
  totalSortis: number;
  /** Contrats à déclarer dont on SAIT qu'ils ne sont pas déclarés (donnée négative constatée). */
  nonDeclares: number;
  /**
   * Contrats à déclarer dont l'état n'a jamais été renseigné. Volontairement compté à part :
   * une conformité non constatée n'est pas une conformité, mais ce n'est pas non plus une
   * infraction constatée — les deux chiffres ne se traitent pas de la même façon.
   */
  aConfirmer: number;
  totalAnomalies: number;
  masseDernierMoisCloture: number | null;
  agences: string[];
  types: string[];
}
