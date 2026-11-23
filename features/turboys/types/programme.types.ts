// Module M2 — Programmes hebdomadaires planifiés par les Opérations.
// Consomme /api/erp/programmes (backend déployé). Le programme EST un emploi
// du temps + un workflow de statut.

export type StatutProgramme = 'BROUILLON' | 'PLANIFIE' | 'NOTIFIE' | 'ACCEPTE' | 'REFUSE';

// Type de collaborateur (axe « contrat ») renvoyé par le backend pour le
// filtre TYPE et le sous-libellé de la grille. Aligné sur LivreurType.
export type TypeLivreurProgramme = 'JOURNALIER' | 'SUPERVISEUR_LIVREUR' | 'INDEPENDANT';

// Maquette M2 — un poste/partenaire (restaurant) desservi sur un jour. Le nom
// est dénormalisé (le backend le stocke tel quel dans le JSON du jour).
export interface IPosteJour {
  restaurantId: string;
  restaurantNom: string;
}

export interface IJourProgramme {
  jour: string; // LUNDI, MARDI, ... DIMANCHE
  date?: string | null;
  debut?: string | null; // "HH:mm" ou "HH:mm:ss"
  fin?: string | null;
  actif: boolean;
  postes?: IPosteJour[] | null;
  /**
   * Frais de carburant du jour (FCFA), saisis par les Ops. Sans objet un jour de repos.
   *
   * <p>C'est une intention de planning. Le total qui fait foi est
   * `IProgramme.montantCarburantHebdo`, figé par le serveur à la publication.</p>
   */
  montantCarburant?: number | null;
  /**
   * Ce que la clôture nocturne a CONSTATÉ : PRESENT, RETARD, ABSENT, JUSTIFIE, NON_INSCRIT.
   *
   * <p>Posé par le serveur, jamais par l'éditeur. La clôture repasse aussi `actif` à false
   * quand elle conclut à une absence : sans ce champ, l'écran affichait une absence comme
   * un repos.</p>
   */
  statutJour?: string | null;
  absenceJustifiee?: boolean | null;
  absenceMotif?: string | null;
}

/** Ce qu'a donné le dernier envoi du programme par WhatsApp. */
export type StatutEnvoiWhatsApp = 'ENVOYE' | 'ECHEC' | 'NON_CONFIGURE' | 'SANS_NUMERO';

export interface IProgramme {
  id: string;
  livreurId: string | null;
  livreurNom: string | null;
  typeLivreur?: TypeLivreurProgramme | string | null;
  annee: number;
  semaine: number;
  jours: IJourProgramme[];
  statut: StatutProgramme | null;
  source: string | null;
  publieLe: string | null;
  accepteLe: string | null;
  refuseLe: string | null;
  motifRefus: string | null;
  nbRelances: number;
  /**
   * Total carburant de la semaine, FIGÉ par le serveur quand le programme part chez le
   * livreur. Null tant que rien n'est engagé, ou qu'aucun montant n'a été saisi.
   */
  montantCarburantHebdo?: number | null;
  /**
   * Le site (partenaire) effectif de la semaine : celui choisi pour le programme, sinon
   * celui de la fiche du livreur. Les exports regroupent par ce site.
   */
  siteId?: string | null;
  /** Vrai quand le site a été choisi pour cette semaine, faux quand il vient de la fiche. */
  siteDeLaSemaine?: boolean;
  /** Dernier envoi WhatsApp ; absent tant que rien n'a été tenté. */
  whatsappStatut?: StatutEnvoiWhatsApp | string | null;
  whatsappLe?: string | null;
  /** L'identifiant du message parti, ou la raison de l'échec. */
  whatsappDetail?: string | null;
  /** Dernière relance des preuves Wave manquantes (RG-W07) ; absent si jamais relancé. */
  preuvesRelanceLe?: string | null;
  /** Jamais absent côté serveur, mais typé optionnel pour les jeux d'essai des bancs. */
  complement?: IComplementProgramme;
}

// ── Sites, surplus et preuves (SPEC-ERP-TURBO-PLANNING-SITES, novembre 2026) ──

/** Motif d'un surplus de carburant (RG-C02). Liste fermée côté serveur. */
export type MotifSurplus = 'RENFORT_AUTRE_SITE' | 'LONGUE_DISTANCE' | 'PIC_ACTIVITE' | 'AUTRE';

export const MOTIFS_SURPLUS: { label: string; value: MotifSurplus }[] = [
  { label: 'Renfort autre site', value: 'RENFORT_AUTRE_SITE' },
  { label: 'Longue distance', value: 'LONGUE_DISTANCE' },
  { label: "Pic d'activité", value: 'PIC_ACTIVITE' },
  { label: 'Autre', value: 'AUTRE' },
];

/**
 * Du carburant accordé EN PLUS de la dotation d'un jour (SPEC §7).
 *
 * <p>Un surplus ANNULÉ arrive quand même : RG-C07 veut qu'il reste visible, barré, avec
 * qui l'a annulé et pourquoi. Il ne compte pas dans le carburant du jour.</p>
 */
export interface ISurplus {
  id: string;
  jour: string;
  siteId: string;
  montant: number;
  motif: MotifSurplus | string;
  commentaire?: string | null;
  accordePar?: string | null;
  accordeLe?: string | null;
  annule: boolean;
  annulePar?: string | null;
  annuleLe?: string | null;
  motifAnnulation?: string | null;
}

export type StatutPreuveCarburant = 'RECUE' | 'VALIDEE' | 'REJETEE';

/**
 * Une capture Wave envoyée par le livreur (SPEC §9).
 *
 * <p>`surplusId` nul = la preuve porte sur la dotation du jour. Plusieurs captures par
 * jour sont normales : une capture rejetée est conservée et la suivante s'ajoute.</p>
 */
export interface IPreuveCarburant {
  id: string;
  jour: string;
  surplusId?: string | null;
  fichierUrl: string;
  envoyeLe: string | null;
  montantRecu?: number | null;
  recuLe?: string | null;
  referenceTransaction?: string | null;
  statut: StatutPreuveCarburant | string;
  validePar?: string | null;
  valideLe?: string | null;
  motifRejet?: string | null;
}

/**
 * Ce qu'un programme porte hors de sa ligne : sites desservis, bases gérées, et par jour
 * les sites cochés, les surplus et les preuves.
 *
 * <p>Les cartes sont indexées par le NOM du jour (`LUNDI`…`DIMANCHE`). Un programme
 * antérieur à novembre 2026 n'a rien de tout cela : listes et cartes vides, ce qui se lit
 * « base seule » et qui est sa vérité.</p>
 */
export interface IComplementProgramme {
  sitesDesservis: string[];
  basesGerees: string[];
  sitesParJour: Record<string, string[]>;
  surplusParJour: Record<string, ISurplus[]>;
  preuvesParJour: Record<string, IPreuveCarburant[]>;
}

export const COMPLEMENT_VIDE: IComplementProgramme = {
  basesGerees: [],
  preuvesParJour: {},
  sitesDesservis: [],
  sitesParJour: {},
  surplusParJour: {},
};

export interface ICreerProgrammePayload {
  livreurId: string;
  annee: number;
  semaine: number;
  jours: IJourProgramme[];
  /** Le site de la semaine ; absent = celui de la fiche du livreur. */
  sitePartnerId?: string | null;
  /**
   * Sites desservis de la semaine, en plus du site de base (RG-S02).
   *
   * <p>⚠ ABSENT et VIDE ne disent pas la même chose. Absent = la commande ne parle pas
   * des sites, le serveur n'y touche pas. Tableau vide = « plus aucun », et il efface.
   * Sans cette distinction, « Ajuster le carburant » effacerait les sites au passage.</p>
   */
  sitesDesservis?: string[];
  /** Sites cochés par jour (RG-S03), indexés par nom de jour. Même convention. */
  sitesParJour?: Record<string, string[]>;
  /** Bases gérées d'un superviseur-livreur (RG-V01). Même convention. */
  basesGerees?: string[];
}

export interface IModifierProgrammePayload {
  id: string;
  jours: IJourProgramme[];
  /** Vrai quand la commande décide du site ; absent, le site de la semaine ne bouge pas. */
  siteModifie?: boolean;
  /** Avec `siteModifie` : le site de la semaine, null pour revenir à celui de la fiche. */
  sitePartnerId?: string | null;
  /**
   * Sites desservis de la semaine, en plus du site de base (RG-S02).
   *
   * <p>⚠ ABSENT et VIDE ne disent pas la même chose. Absent = la commande ne parle pas
   * des sites, le serveur n'y touche pas. Tableau vide = « plus aucun », et il efface.
   * Sans cette distinction, « Ajuster le carburant » effacerait les sites au passage.</p>
   */
  sitesDesservis?: string[];
  /** Sites cochés par jour (RG-S03), indexés par nom de jour. Même convention. */
  sitesParJour?: Record<string, string[]>;
  /** Bases gérées d'un superviseur-livreur (RG-V01). Même convention. */
  basesGerees?: string[];
}

/** Dupliquer tous les programmes d'une semaine vers une semaine vide. */
export interface IDupliquerSemainePayload {
  annee: number;
  semaine: number;
  depuisAnnee: number;
  depuisSemaine: number;
}

export interface IDuplicationSemaine {
  annee: number;
  semaine: number;
  depuisAnnee: number;
  depuisSemaine: number;
  crees: number;
  ignores: number;
  /** Livreurs qui avaient déjà déclaré cette semaine dans l'application ; leur déclaration est intacte. */
  dejaDeclares: number;
}

// ── Carburant : engagement de la semaine dans le circuit finance ──────────────

export type StatutChargeVariable =
  | 'EN_ATTENTE_DGA'
  | 'VALIDE_DGA'
  | 'REJETE_DGA'
  | 'APPROUVE_DG'
  | 'REJETE_DG'
  | 'DECAISSE';

/** La charge variable qui porte le carburant d'une semaine (extrait du VM finance). */
export interface IEngagementCarburant {
  id: string;
  designation: string;
  montant: number;
  statut: StatutChargeVariable | string;
  creerPar?: string | null;
  dateDepense?: string | null;
  createdAt?: string | null;
  justificatif?: string | null;
}

/** Ce que la semaine a publié, et ce qui en est engagé. */
export interface IEtatCarburantSemaine {
  annee: number;
  semaine: number;
  /** Somme des totaux figés des programmes publiés ; null si aucun n'en porte. */
  totalPublie: number | null;
  nbProgrammesPublies: number;
  nbProgrammesSansMontant: number;
  engagement: IEngagementCarburant | null;
  /** totalPublie moins le montant engagé ; null sans engagement. */
  ecart: number | null;
}

export interface IEngagerCarburantPayload {
  annee: number;
  semaine: number;
  categorieId: string;
  /** Le PDF des programmes publiés, joint en justificatif. */
  justificatif: Blob;
}

// RG-32 — autosuffisance : livreurs actifs par jour, indépendants vs planifiés.
export interface IAutosuffisanceJour {
  jour: string; // LUNDI..DIMANCHE
  independants: number;
  planifies: number;
  total: number;
}

/**
 * Le bandeau carburant du haut de page (§8.2, RG-W05).
 *
 * Il répond à une seule question : combien faut-il décaisser cette semaine, et d'où vient
 * ce chiffre. D'où la décomposition — dotation validée, surplus, puis la répartition entre
 * journaliers et superviseurs-livreurs, qui ne passent pas par le même circuit de paiement.
 *
 * ⚠ Les quatre compteurs de preuves ne portent QUE sur les programmes publiés et les jours
 * déjà passés. Compter une preuve pour demain la ferait voir « manquante » alors que
 * l'argent n'est pas encore versé.
 */
export interface IBandeauCarburant {
  annee: number;
  semaine: number;
  /** Chiffre principal : dotation publiée + surplus non annulés. */
  totalADecaisser: number;
  /** Ce que les programmes publiés portaient, avant tout surplus. */
  dotationValidee: number;
  totalSurplus: number;
  totalJournaliers: number;
  nbProgrammesJournaliers: number;
  totalSuperviseurs: number;
  nbProgrammesSuperviseurs: number;
  /** Ce qui est réellement engagé en comptabilité, `null` tant que rien ne l'est. */
  montantEngage: number | null;
  preuvesAttendues: number;
  preuvesRecues: number;
  preuvesValidees: number;
  preuvesManquantes: number;
}

/**
 * Affecter un livreur à un autre site EN COURS D'OPÉRATIONS (§3.3, RG-S08).
 *
 * ⚠ Le motif est obligatoire, et ce n'est pas de la paperasse : c'est la seule chose qui,
 * trois semaines plus tard, dira si ce renfort était un dépannage ou le signe qu'un site
 * est durablement sous-doté.
 */
export interface IAffecterSitePayload {
  siteId: string;
  jour: string;
  motif: string;
}

/** Accorder du carburant en plus de la dotation d'un jour (RG-C02). */
export interface IAccorderSurplusPayload {
  jour: string;
  siteId: string;
  montant: number;
  motif: MotifSurplus;
  /** Obligatoire quand le motif est `AUTRE` : sinon « Autre » ne dit rien. */
  commentaire?: string | null;
}

/**
 * Où en est la soumission des surplus d'une semaine (décision du 23/11).
 *
 * L'écran s'en sert AVANT le geste autant qu'après : il doit pouvoir dire « 6 surplus,
 * 15 000 FCFA, soumissible à partir du lundi 1er décembre » sans qu'on ait à cliquer pour
 * l'apprendre.
 */
export interface ISoumissionSurplus {
  annee: number;
  semaine: number;
  nbASoumettre: number;
  montantASoumettre: number;
  nbDejaSoumis: number;
  montantDejaSoumis: number;
  /** Le lundi à partir duquel la soumission est possible, en ISO. */
  soumissibleLe: string;
  soumissible: boolean;
  /** Pourquoi ce n'est pas soumissible, en une phrase. `null` si ça l'est. */
  empechement: string | null;
  chargeId: string | null;
}

/** Valider une capture Wave : les trois valeurs relevées DESSUS par la comptabilité. */
export interface IValiderPreuvePayload {
  montantRecu: number;
  recuLe?: string | null;
  /** ID de transaction Wave (ex. T_IA6OREV2MUG-QV6ZQ). Obligatoire : c'est le verrou. */
  referenceTransaction: string;
}

/** Un versement dont la preuve manque. */
export interface IVersementManquant {
  jour: string;
  montant: number;
  /** Vrai = c'est un surplus ; faux = la dotation du jour. */
  surplus: boolean;
}

export interface ILivreurEnRetard {
  programmeId: string;
  livreurId: string | null;
  livreurNom: string;
  telephone: string | null;
  nbManquantes: number;
  montantManquant: number;
  versements: IVersementManquant[];
  /** Dernière relance envoyée sur ce programme, en ISO, ou `null`. */
  relanceLe: string | null;
}

/**
 * Qui a des preuves Wave manquantes, et sur quoi (RG-W07, CA-56).
 *
 * La fenêtre de relance le montre AVANT d'envoyer : relancer quelqu'un sans savoir sur
 * quoi, c'est l'obliger à chercher.
 */
export interface IRelancePreuves {
  annee: number;
  semaine: number;
  nbManquantes: number;
  livreurs: ILivreurEnRetard[];
}

/**
 * Un secteur ou une couverture, avec ses sites (§8.5, §8.6).
 *
 * Même forme pour les deux : ils ne diffèrent que par leur usage — le secteur alimente
 * les onglets et les groupes de la liste, la couverture regroupe la grille site × jour.
 */
export interface IGroupeSites {
  id: string;
  nom: string;
  ordre: number;
  siteIds: string[];
}

export interface IGroupeSitesPayload {
  nom: string;
  ordre?: number;
  /**
   * `undefined` = ne pas toucher aux sites ; `[]` = vider le groupe.
   *
   * ⚠ La distinction compte : un simple renommage ne doit pas détacher tous les sites
   * parce que le formulaire ne les a pas renvoyés.
   */
  siteIds?: string[];
}
